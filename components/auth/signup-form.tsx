"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react"
import { SocialLoginButtons } from "./social-login-buttons"

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    marketing: false,
  })
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.")
      return
    }

    if (!agreements.terms || !agreements.privacy) {
      alert("필수 약관에 동의해주세요.")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || '회원가입에 실패했습니다.');
      }
  
      // 회원가입 성공 시 자동 로그인 처리
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userProfile", JSON.stringify(data.user));
  
      // 성공 메시지 표시
      alert('회원가입이 완료되었습니다!');
      
      // 메인 페이지로 이동
      window.location.href = "/";
    } catch (error) {
      console.error('회원가입 실패:', error);
      alert(error instanceof Error ? error.message : '회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleAgreementChange = (key: keyof typeof agreements, checked: boolean) => {
    setAgreements((prev) => ({
      ...prev,
      [key]: checked,
    }))
  }

  return (
    <div className="space-y-6">
      {/* 소셜 로그인 */}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full bg-onair-text-sub/20" />
        </div>
      </div>

      {/* 이메일 회원가입 폼 */}
      <Card className="bg-onair-bg-sub border-onair-text-sub/20">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-onair-text">
                이름
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-onair-text-sub" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="이름을 입력하세요"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="pl-10 bg-onair-bg border-onair-text-sub/20 text-onair-text placeholder:text-onair-text-sub focus:border-onair-mint"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-onair-text">
                이메일
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-onair-text-sub" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10 bg-onair-bg border-onair-text-sub/20 text-onair-text placeholder:text-onair-text-sub focus:border-onair-mint"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-onair-text">
                비밀번호
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-onair-text-sub" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 bg-onair-bg border-onair-text-sub/20 text-onair-text placeholder:text-onair-text-sub focus:border-onair-mint"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-onair-text-sub hover:text-onair-text"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-onair-text">
                비밀번호 확인
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-onair-text-sub" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="비밀번호를 다시 입력하세요"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 bg-onair-bg border-onair-text-sub/20 text-onair-text placeholder:text-onair-text-sub focus:border-onair-mint"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-onair-text-sub hover:text-onair-text"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* 약관 동의 */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreements.terms}
                  onCheckedChange={(checked) => handleAgreementChange("terms", checked as boolean)}
                  className="border-onair-text-sub/20 data-[state=checked]:bg-onair-mint data-[state=checked]:border-onair-mint"
                />
                <Label htmlFor="terms" className="text-sm text-onair-text">
                  <span className="text-onair-orange">[필수]</span> 서비스 이용약관에 동의합니다
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="privacy"
                  checked={agreements.privacy}
                  onCheckedChange={(checked) => handleAgreementChange("privacy", checked as boolean)}
                  className="border-onair-text-sub/20 data-[state=checked]:bg-onair-mint data-[state=checked]:border-onair-mint"
                />
                <Label htmlFor="privacy" className="text-sm text-onair-text">
                  <span className="text-onair-orange">[필수]</span> 개인정보 처리방침에 동의합니다
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="marketing"
                  checked={agreements.marketing}
                  onCheckedChange={(checked) => handleAgreementChange("marketing", checked as boolean)}
                  className="border-onair-text-sub/20 data-[state=checked]:bg-onair-mint data-[state=checked]:border-onair-mint"
                />
                <Label htmlFor="marketing" className="text-sm text-onair-text">
                  <span className="text-onair-text-sub">[선택]</span> 마케팅 정보 수신에 동의합니다
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-onair-mint hover:bg-onair-mint/90 text-onair-bg font-medium"
              disabled={isLoading}
            >
              {isLoading ? "가입 중..." : "회원가입"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
