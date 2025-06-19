"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getAuthStatus } from "@/lib/auth-utils"

interface AIModel {
  id: number;
  _id: string;
  name: string;
  type: string;
  quality: string;
  description: string;
  avatar: string;
  createdAt: string;
  usageCount: number;
  url: string;
}

interface AIModelContextType {
  models: AIModel[];
  isLoading: boolean;
  error: string | null;
  refreshModels: () => Promise<void>;
  defaultModelId: string | null;
}

const AIModelContext = createContext<AIModelContextType | undefined>(undefined)

export function AIModelProvider({ children }: { children: ReactNode }) {
  const [models, setModels] = useState<AIModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [defaultModelId, setDefaultModelId] = useState<string | null>(null)

  const fetchDefaultModel = async (email: string) => {
    try {
      const response = await fetch(`/api/users/default-model?email=${email}`);
      if (response.ok) {
        const data = await response.json();
        setDefaultModelId(data.isDefault);
      }
    } catch (error) {
      console.error("기본 모델 정보를 가져오는데 실패했습니다:", error);
    }
  };

  const fetchModels = async () => {
    try {
      setIsLoading(true)
      const { userProfile } = getAuthStatus()
      if (!userProfile?.email) {
        throw new Error('사용자 정보를 찾을 수 없습니다.')
      }

      // 기본 모델 정보 가져오기
      await fetchDefaultModel(userProfile.email);

      // 로컬 스토리지에서 캐시된 데이터 확인
      // const cachedData = localStorage.getItem('aiModels')
      // const cacheTimestamp = localStorage.getItem('aiModelsTimestamp')
      // const now = new Date().getTime()
      
      // // 캐시가 있고 5분 이내라면 캐시된 데이터 사용
      // if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < 300000) {
      //   setModels(JSON.parse(cachedData))
      //   setIsLoading(false)
      //   return
      // }

      // 사용자 모델 가져오기
      const userResponse = await fetch(`/api/models?email=${userProfile.email}`)
      let userModels: AIModel[] = []
      
      if (userResponse.ok) {
        const userData = await userResponse.json()
        userModels = userData.map((model: any, index: number) => ({
          id: index + 1,
          _id: model._id,
          name: model.name,
          type: model.type,
          quality: model.quality,
          description: model.description,
          avatar: model.avatar || "/placeholder.svg?height=40&width=40",
          createdAt: new Date(model.createdAt).toLocaleDateString(),
          usageCount: model.usageCount || 0,
          url: model.url || model.modelUrl,
        }))
      }

      // 관리자 모델 가져오기
      const adminResponse = await fetch(`/api/models?email=admin@tennyvoice.com`)
      let adminModels: AIModel[] = []
      
      if (adminResponse.ok) {
        const adminData = await adminResponse.json()
        adminModels = adminData.map((model: any, index: number) => ({
          id: userModels.length + index + 1,
          _id: model._id,
          name: model.name,
          type: model.type,
          quality: model.quality,
          description: model.description,
          avatar: model.avatar || "/placeholder.svg?height=40&width=40",
          createdAt: new Date(model.createdAt).toLocaleDateString(),
          usageCount: model.usageCount || 0,
          url: model.url || model.modelUrl,
        }))
      }

      const allModels = [...userModels, ...adminModels]
      setModels(allModels)
      
      // // 로컬 스토리지에 데이터 캐싱
      // localStorage.setItem('aiModels', JSON.stringify(allModels))
      // localStorage.setItem('aiModelsTimestamp', now.toString())
    } catch (error) {
      setError('AI 모델을 불러오는데 실패했습니다.')
      console.error('Failed to fetch models:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 모델 저장 후 새로고침 함수
  const refreshModels = async () => {
    await fetchModels()
  }

  useEffect(() => {
    fetchModels()
  }, [])

  return (
    <AIModelContext.Provider value={{ models, isLoading, error, refreshModels, defaultModelId }}>
      {children}
    </AIModelContext.Provider>
  )
}

export function useAIModels() {
  const context = useContext(AIModelContext)
  if (context === undefined) {
    throw new Error('useAIModels must be used within an AIModelProvider')
  }
  return context
} 