"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, LinkIcon, Type } from "lucide-react"
import { extractTextFromUrl, extractTextFromPdf } from "@/lib/api"

interface CustomSentenceUploadProps {
  onSentenceSelect: (sentence: string) => void
}

export function CustomSentenceUpload({ onSentenceSelect }: CustomSentenceUploadProps) {
  const [textInput, setTextInput] = useState("")
  const [urlInput, setUrlInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // 탭별 상태 분리
  const [textExtracted, setTextExtracted] = useState("")
  const [urlExtracted, setUrlExtracted] = useState("")
  const [fileExtracted, setFileExtracted] = useState("")

  const [currentTab, setCurrentTab] = useState("text")

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      setTextExtracted(textInput.trim())
      onSentenceSelect(textInput.trim())
    }
  }

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return
    setIsLoading(true)
    try {
      const extracted = await extractTextFromUrl(urlInput)
      setUrlExtracted(extracted)
      onSentenceSelect(extracted)
    } catch (error) {
      console.error("URL 처리 실패:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setIsLoading(true)
    try {
      if (file.type === "text/plain") {
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          setFileExtracted(content)
          onSentenceSelect(content)
        }
        reader.readAsText(file)
      } else if (file.type === "application/pdf") {
        const extracted = await extractTextFromPdf(file)
        setFileExtracted(extracted)
        onSentenceSelect(extracted)
      } else {
        console.error("지원하지 않는 파일 형식입니다.")
      }
    } catch (error) {
      console.error("파일 업로드 실패:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 현재 탭별 상태 반환
  const getExtractedText = () => {
    switch (currentTab) {
      case "text":
        return textExtracted
      case "url":
        return urlExtracted
      case "file":
        return fileExtracted
      default:
        return ""
    }
  }

  // 현재 탭별 상태 설정 및 onSentenceSelect 호출
  const setExtractedText = (value: string) => {
    switch (currentTab) {
      case "text":
        setTextExtracted(value)
        setTextInput(value)  // 탭 내부 입력창과 동기화
        break
      case "url":
        setUrlExtracted(value)
        break
      case "file":
        setFileExtracted(value)
        break
    }
    onSentenceSelect(value)
  }

  return (
    <Card className="bg-onair-bg-sub border-onair-text-sub/20">
      <CardHeader>
        <CardTitle className="text-onair-text flex items-center gap-2">
          <Upload className="w-5 h-5" />
          문장 업로드
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="text"
          className="space-y-4"
          onValueChange={(value) => setCurrentTab(value)}
        >
          <TabsList className="grid w-full grid-cols-3 bg-onair-bg">
            <TabsTrigger value="text" className="data-[state=active]:bg-onair-mint data-[state=active]:text-onair-bg">
              <Type className="w-4 h-4 mr-2" />
              텍스트 입력
            </TabsTrigger>
            <TabsTrigger value="url" className="data-[state=active]:bg-onair-mint data-[state=active]:text-onair-bg">
              <LinkIcon className="w-4 h-4 mr-2" />
              URL 링크
            </TabsTrigger>
            <TabsTrigger value="file" className="data-[state=active]:bg-onair-mint data-[state=active]:text-onair-bg">
              <FileText className="w-4 h-4 mr-2" />
              파일 업로드
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text-input" className="text-onair-text">
                연습할 문장을 입력하세요
              </Label>
              <Textarea
                id="text-input"
                placeholder="여기에 연습하고 싶은 문장을 입력하세요..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="min-h-[120px] bg-onair-bg border-onair-text-sub/20 text-onair-text placeholder:text-onair-text-sub focus:border-onair-mint"
              />
            </div>
            <Button
              onClick={handleTextSubmit}
              disabled={!textInput.trim()}
              className="w-full bg-onair-mint hover:bg-onair-mint/90 text-onair-bg"
            >
              이 문장으로 훈련하기
            </Button>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url-input" className="text-onair-text">
                웹페이지 URL을 입력하세요
              </Label>
              <Input
                id="url-input"
                type="url"
                placeholder="https://example.com/article"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="bg-onair-bg border-onair-text-sub/20 text-onair-text placeholder:text-onair-text-sub focus:border-onair-mint"
              />
              <p className="text-sm text-onair-text-sub">
                뉴스 기사, 블로그 포스트 등의 URL에서 텍스트를 자동으로 추출합니다.
              </p>
            </div>
            <Button
              onClick={handleUrlSubmit}
              disabled={!urlInput.trim() || isLoading}
              className="w-full bg-onair-mint hover:bg-onair-mint/90 text-onair-bg"
            >
              {isLoading ? "텍스트 추출 중..." : "URL에서 텍스트 추출하기"}
            </Button>
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-input" className="text-onair-text">
                파일을 업로드하세요
              </Label>
              <div className="border-2 border-dashed border-onair-text-sub/20 rounded-lg p-6 text-center">
                <Input
                  id="file-input"
                  type="file"
                  accept=".txt,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Label htmlFor="file-input" className="cursor-pointer flex flex-col items-center space-y-2">
                  <Upload className="w-8 h-8 text-onair-text-sub" />
                  <span className="text-onair-text">파일을 선택하거나 드래그하세요</span>
                  <span className="text-sm text-onair-text-sub">지원 형식: TXT, PDF (최대 10MB)</span>
                </Label>
              </div>
            </div>
            {isLoading && (
              <div className="text-center">
                <div className="inline-flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-onair-mint border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-onair-text-sub">파일 처리 중...</span>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

      </CardContent>
    </Card>
  )
}




