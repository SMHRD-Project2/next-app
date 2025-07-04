#!/usr/bin/env python
# -*- coding: utf-8 -*-

import warnings
warnings.filterwarnings("ignore")

import numpy as np
import librosa
import scipy.signal
import noisereduce as nr
from dtw import dtw
from scipy.spatial.distance import euclidean, cosine
import parselmouth
from parselmouth.praat import call

# ---------- 분석 항목 가중치 ----------
WEIGHTS = dict(
    mfcc=0.20, pitch=0.15, energy=0.10, speed=0.10,
    formant=0.15, intonation=0.15, rhythm=0.10, pause=0.05
)

class Analyzer:
    # 초기화 & 전처리
    def __init__(self, ref_file: str, usr_file: str,
                 hp_cutoff: float = 60.0,           # 고역 차단 주파수(Hz)
                 noise_head: float = 0.3):          # 잡음 프로파일 구간(초)
        # 1) 로드
        self.ref_y, self.ref_sr = librosa.load(ref_file, sr=None)
        self.usr_y, self.usr_sr = librosa.load(usr_file, sr=None)

        # 2) 샘플레이트 통일
        if self.ref_sr != self.usr_sr:
            self.usr_y  = librosa.resample(self.usr_y,
                                           orig_sr=self.usr_sr,
                                           target_sr=self.ref_sr)
            self.usr_sr = self.ref_sr

        # 3) 고역 차단(선택) 
        self.ref_y = self._highpass(self.ref_y, self.ref_sr, hp_cutoff)
        self.usr_y = self._highpass(self.usr_y, self.usr_sr, hp_cutoff)

        # 4) 잡음 제거 
        self.ref_y = self._denoise(self.ref_y, self.ref_sr, noise_head)
        self.usr_y = self._denoise(self.usr_y, self.usr_sr, noise_head)

        # 5) parselmouth Sound 객체
        self.ref_sound = parselmouth.Sound(self.ref_y, self.ref_sr)
        self.usr_sound = parselmouth.Sound(self.usr_y, self.usr_sr)

        # 6) 기타 정보
        self.ref_dur = len(self.ref_y) / self.ref_sr
        self.usr_dur = len(self.usr_y) / self.usr_sr
        self.res     = {}   # 결과 저장용 dict
    #Noise-Reduction 단계 
    def _highpass(self, y: np.ndarray, sr: int, cutoff: float):
        sos = scipy.signal.butter(N=6, Wn=cutoff, btype='highpass',
                                  fs=sr, output='sos')
        return scipy.signal.sosfiltfilt(sos, y)

    def _denoise(self, y: np.ndarray, sr: int, noise_head: float):
        # 음성 앞부분에서 잡음 프로파일 추출
        noise_clip = y[: int(sr * noise_head)]
        return nr.reduce_noise(y=y,
                               y_noise=noise_clip,
                               sr=sr,
                               prop_decrease=1.0,   # 강한 제거
                               stationary=False)

    # ──────────────────────────────────────────────────────────────────
    #                             분석 함수
    # ──────────────────────────────────────────────────────────────────
    def mfcc(self, n=13):
        def cmvn(m): return (m - m.mean(1, keepdims=True)) / (m.std(1, keepdims=True)+1e-8)
        ref = cmvn(librosa.feature.mfcc(y=self.ref_y, sr=self.ref_sr, n_mfcc=n))
        usr = cmvn(librosa.feature.mfcc(y=self.usr_y, sr=self.usr_sr, n_mfcc=n))
        min_frames = min(ref.shape[1], usr.shape[1])
        dist = dtw(ref[:, :min_frames].T, usr[:, :min_frames].T,
                   dist_method=euclidean).distance
        norm = dist / (min_frames * n)
        score = 100 * (1 - norm / (norm + 1.8))
        self.res["mfcc"] = max(0, min(100, score))

    def pitch(self):
        ref_p = call(self.ref_sound, "To Pitch", 0.0, 75, 600)
        usr_p = call(self.usr_sound, "To Pitch", 0.0, 75, 600)

        def get_vals(pitch, dur):
            vals = [call(pitch, "Get value at time", t, "Hertz", "Linear")
                    for t in np.arange(0, dur, 0.01)]
            return np.array([v for v in vals if not np.isnan(v)])

        r, u = get_vals(ref_p, self.ref_dur), get_vals(usr_p, self.usr_dur)
        if len(r) == 0 or len(u) == 0:
            self.res["pitch"] = 0
            return

        def stats(x): return np.mean(x), np.std(x), np.ptp(x)
        rm, rs, rr = stats(r); um, us, ur = stats(u)
        score = 100 * (1 - (0.4 * abs(rm - um) / rm
                            + 0.3 * abs(rs - us) / rs
                            + 0.3 * abs(rr - ur) / rr))
        self.res["pitch"] = max(0, min(100, score))

    def energy(self):
        r = librosa.feature.rms(y=self.ref_y)[0]
        u = librosa.feature.rms(y=self.usr_y)[0]
        rm, rs = np.mean(r), np.std(r)
        um, us = np.mean(u), np.std(u)
        min_len = min(len(r), len(u))
        r2 = librosa.resample(r, orig_sr=len(r), target_sr=min_len)
        u2 = librosa.resample(u, orig_sr=len(u), target_sr=min_len)
        dtw_d = dtw(r2.reshape(-1, 1), u2.reshape(-1, 1),
                    dist_method=euclidean).normalizedDistance
        score = 100 * (1 - (0.3 * abs(rm - um) / rm
                            + 0.3 * abs(rs - us) / rs
                            + 0.4 * min(1, dtw_d / 2)))
        self.res["energy"] = max(0, min(100, score))

    def speed(self):
        def syllables(y, sr):
            env = np.convolve(np.abs(y),
                              np.ones(int(sr * 0.02)) / int(sr * 0.02),
                              'same')
            peaks, _ = scipy.signal.find_peaks(env,
                                               height=0.05,
                                               distance=int(sr * 0.05))
            return len(peaks)

        rs = syllables(self.ref_y, self.ref_sr) / self.ref_dur
        us = syllables(self.usr_y, self.usr_sr) / self.usr_dur
        score = 100 * (1 - min(1, abs(rs - us) / rs))
        self.res["speed"] = max(0, min(100, score))

    def formant(self):
        try:
            r_fm = call(self.ref_sound, "To Formant (burg)",
                        0, 5, 5500, 0.025, 50)
            u_fm = call(self.usr_sound, "To Formant (burg)",
                        0, 5, 5500, 0.025, 50)
            pts = np.arange(0.1,
                            min(self.ref_dur, self.usr_dur) - 0.1,
                            0.01)

            def collect(fm, idx):
                return np.array([call(fm, "Get value at time", idx,
                                      t, "Hertz", "Linear") for t in pts])

            rf1, rf2, rf3 = collect(r_fm, 1), collect(r_fm, 2), collect(r_fm, 3)
            uf1, uf2, uf3 = collect(u_fm, 1), collect(u_fm, 2), collect(u_fm, 3)
            mask = lambda x: x[~np.isnan(x)]
            rf1, rf2, rf3, uf1, uf2, uf3 = map(mask,
                                               [rf1, rf2, rf3, uf1, uf2, uf3])
            if len(rf1) == 0 or len(uf1) == 0:
                self.res["formant"] = 0
                return

            def diff(a, b): return abs(a - b) / a
            score = 100 * (1 - (0.3 * diff(rf1.mean(), uf1.mean())
                                + 0.3 * diff(rf2.mean(), uf2.mean())
                                + 0.2 * diff(rf3.mean(), uf3.mean())
                                + 0.2 * diff(rf2.mean() / rf1.mean(),
                                             uf2.mean() / uf1.mean())))
            self.res["formant"] = max(0, min(100, score))
        except:                                     # noqa
            self.res["formant"] = 0

    def intonation(self):
        try:
            def norm_pitch(sound, dur):
                p = call(sound, "To Pitch", 0, 75, 600)
                vals = [call(p, "Get value at time", t,
                             "Hertz", "Linear")
                        for t in np.linspace(0.1, dur - 0.1, 100)]
                vals = np.array([v for v in vals if not np.isnan(v)])
                return (vals - vals.min()) / (vals.ptp() + 1e-6)

            r, u = norm_pitch(self.ref_sound, self.ref_dur), \
                   norm_pitch(self.usr_sound, self.usr_dur)
            L = min(len(r), len(u)); r, u = r[:L], u[:L]
            dist = dtw(r.reshape(-1, 1), u.reshape(-1, 1),
                       dist_method=euclidean).normalizedDistance

            def change(x): return np.std(np.diff(x))
            diff_change = abs(change(r) - change(u)) / max(change(r), 1e-6)
            score = 100 * (1 - (0.7 * min(1, dist)
                                + 0.3 * diff_change))
            self.res["intonation"] = max(0, min(100, score))
        except:                                     # noqa
            self.res["intonation"] = 0

    def rhythm(self):
        def envelope(y, sr):
            rms = librosa.feature.rms(y=y)[0]
            return rms / np.max(rms)

        ref_env, usr_env = envelope(self.ref_y, self.ref_sr), \
                           envelope(self.usr_y, self.usr_sr)

        def autocorr(x): return np.correlate(x, x, mode='full')[len(x) - 1:]

        r_auto, u_auto = autocorr(ref_env), autocorr(usr_env)
        L = min(len(r_auto), len(u_auto)); r_auto, u_auto = r_auto[:L], u_auto[:L]
        sim = 1 - cosine(r_auto, u_auto)

        def peak_consistency(ac):
            peaks, _ = scipy.signal.find_peaks(ac, distance=10)
            return np.std(np.diff(peaks)) / np.mean(np.diff(peaks)) \
                if len(peaks) > 1 else 1

        diff_consistency = abs(peak_consistency(r_auto) -
                               peak_consistency(u_auto))
        score = 100 * (0.6 * sim + 0.4 * (1 - min(1, diff_consistency)))
        self.res["rhythm"] = max(0, min(100, score))

    def pause(self):
        def silences(y, sr):
            power = np.mean(librosa.amplitude_to_db(
                np.abs(librosa.stft(y)), ref=np.max), axis=0)
            times = librosa.times_like(power, sr=sr)
            silent = power < -40
            starts, ends = [], []
            if silent[0]:
                starts.append(times[0])
            for i in range(1, len(silent)):
                if silent[i] and not silent[i - 1]:
                    starts.append(times[i])
                elif not silent[i] and silent[i - 1]:
                    ends.append(times[i])
            if silent[-1]:
                ends.append(times[-1])
            return [(s, e) for s, e in zip(starts, ends) if e - s >= 0.2]

        rs, us = silences(self.ref_y, self.ref_sr), \
                 silences(self.usr_y, self.usr_sr)

        cnt_sim = min(len(rs), len(us)) / max(len(rs), len(us)) if rs and us else 0
        ratio_diff = abs(sum(e - s for s, e in rs) / self.ref_dur
                         - sum(e - s for s, e in us) / self.usr_dur)
        avg_diff = abs((np.mean([e - s for s, e in rs]) if rs else 0)
                       - (np.mean([e - s for s, e in us]) if us else 0))
        score = 100 * (0.4 * cnt_sim
                       + 0.3 * (1 - min(1, ratio_diff))
                       + 0.3 * (1 - min(1, avg_diff)))
        self.res["pause"] = max(0, min(100, score))

    #실행
    def run(self, verbose: bool = True):
        self.mfcc();      self.pitch();      self.energy()
        self.speed();     self.formant();    self.intonation()
        self.rhythm();    self.pause()

        # 종합 점수
        self.res["total"] = sum(self.res[k] * WEIGHTS[k] for k in WEIGHTS)

        # 콘솔 출력
        
        print("\n--- Analysis Result ---")
        for k, label in [
            ("mfcc", "MFCC"), ("pitch", "Pitch"), ("energy", "Energy"),
            ("speed", "Speech-rate"), ("formant", "Formant"),
            ("intonation", "Intonation"), ("rhythm", "Rhythm"),
            ("pause", "Pause"), ("total", "Overall")
        ]:
            print(f"{label:12s}: {self.res.get(k, 0):6.2f}")

        return self.res