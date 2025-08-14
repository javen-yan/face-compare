#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
InsightFace 人脸识别 FastAPI 服务端
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uvicorn
import logging
import os
import sys
from datetime import datetime
from contextlib import asynccontextmanager

# 添加当前目录到 Python 路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from face_recognition import InsightFaceRecognition

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 全局人脸识别实例
face_recognition: Optional[InsightFaceRecognition] = None

# 请求模型
class FaceInitRequest(BaseModel):
    imageData: str = Field(..., description="Base64 编码的图片数据")
    userId: Optional[str] = Field(None, description="可选的用户ID")

class FaceCompareRequest(BaseModel):
    imageData: str = Field(..., description="Base64 编码的待对比图片")
    userId: str = Field(..., description="用户ID")
    threshold: Optional[float] = Field(0.6, description="相似度阈值")

class FaceCompareBatchRequest(BaseModel):
    imageDataList: List[str] = Field(..., description="图片数据列表")
    userId: str = Field(..., description="用户ID")
    threshold: Optional[float] = Field(0.6, description="相似度阈值")

# 响应模型
class BaseResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动代码
    global face_recognition
    try:
        logger.info("正在初始化 InsightFace 人脸识别系统...")
        face_recognition = InsightFaceRecognition()
        logger.info("InsightFace 初始化成功！")
        yield
    finally:
        # 关闭代码
        if face_recognition:
            face_recognition.save_user_data()
            logger.info("InsightFace 资源已释放")
        face_recognition = None

# 创建 FastAPI 应用
app = FastAPI(
    title="InsightFace 人脸识别服务",
    description="基于深度学习的高精度人脸识别 API 服务",
    version="1.0.0",
    lifespan=lifespan
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 健康检查
@app.get("/health")
async def health_check():
    """健康检查接口"""
    if not face_recognition:
        raise HTTPException(status_code=503, detail="服务未就绪")
    
    try:
        health_info = face_recognition.health_check()
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "python": {
                "version": sys.version,
                "platform": sys.platform
            },
            "insightface": health_info
        }
    except Exception as e:
        logger.error(f"健康检查失败: {e}")
        raise HTTPException(status_code=500, detail=f"健康检查失败: {e}")

# 人脸初始化（注册）
@app.post("/api/face-init", response_model=BaseResponse)
async def face_init(request: FaceInitRequest):
    """注册用户人脸"""
    if not face_recognition:
        raise HTTPException(status_code=503, detail="服务未就绪")
    
    try:
        userId = request.userId or f"user_{datetime.now().timestamp()}"
        result = face_recognition.register_face(userId, request.imageData)
        
        if result['success']:
            return BaseResponse(
                success=True,
                message=result['message'],
                data=result['data']
            )
        else:
            return BaseResponse(
                success=False,
                message=result['message']
            )
            
    except Exception as e:
        logger.error(f"人脸注册异常: {e}")
        return BaseResponse(
            success=False,
            message=f"人脸注册失败: {str(e)}"
        )

# 人脸对比
@app.post("/api/face-compare", response_model=BaseResponse)
async def face_compare(request: FaceCompareRequest):
    """人脸对比"""
    if not face_recognition:
        raise HTTPException(status_code=503, detail="服务未就绪")
    
    try:
        result = face_recognition.compare_faces(
            request.userId,
            request.imageData,
            request.threshold
        )
        
        if result['success']:
            return BaseResponse(
                success=True,
                message=result['message'],
                data=result['data']
            )
        else:
            return BaseResponse(
                success=False,
                message=result['message']
            )
            
    except Exception as e:
        logger.error(f"人脸对比异常: {e}")
        return BaseResponse(
            success=False,
            message=f"人脸对比失败: {str(e)}"
        )

# 批量人脸对比
@app.post("/api/face-compare-batch", response_model=BaseResponse)
async def face_compare_batch(request: FaceCompareBatchRequest):
    """批量人脸对比"""
    if not face_recognition:
        raise HTTPException(status_code=503, detail="服务未就绪")
    
    try:
        results = []
        errors = []
        
        for i, image_data in enumerate(request.imageDataList):
            try:
                result = face_recognition.compare_faces(
                    request.userId,
                    image_data,
                    request.threshold
                )
                
                if result['success']:
                    results.append({
                        'index': i,
                        **result['data']
                    })
                else:
                    errors.append({
                        'index': i,
                        'error': result['message']
                    })
                    
            except Exception as e:
                errors.append({
                    'index': i,
                    'error': str(e)
                })
        
        return BaseResponse(
            success=True,
            message="批量对比完成",
            data={
                'results': results,
                'errors': errors,
                'total': len(request.imageDataList),
                'successCount': len(results),
                'errorCount': len(errors)
            }
        )
        
    except Exception as e:
        logger.error(f"批量人脸对比异常: {e}")
        return BaseResponse(
            success=False,
            message=f"批量对比失败: {str(e)}"
        )

# 获取用户信息
@app.get("/api/users/{user_id}", response_model=BaseResponse)
async def get_user_info(user_id: str):
    """获取用户信息"""
    if not face_recognition:
        raise HTTPException(status_code=503, detail="服务未就绪")
    
    try:
        result = face_recognition.get_user_info(user_id)
        
        if result['success']:
            return BaseResponse(
                success=True,
                message=result['message'],
                data=result['data']
            )
        else:
            return BaseResponse(
                success=False,
                message=result['message']
            )
            
    except Exception as e:
        logger.error(f"获取用户信息异常: {e}")
        return BaseResponse(
            success=False,
            message=f"获取用户信息失败: {str(e)}"
        )

# 获取所有用户
@app.get("/api/users", response_model=BaseResponse)
async def get_all_users():
    """获取所有用户列表"""
    if not face_recognition:
        raise HTTPException(status_code=503, detail="服务未就绪")
    
    try:
        result = face_recognition.get_all_users()
        
        if result['success']:
            return BaseResponse(
                success=True,
                message=result['message'],
                data=result['data']
            )
        else:
            return BaseResponse(
                success=False,
                message=result['message']
            )
            
    except Exception as e:
        logger.error(f"获取用户列表异常: {e}")
        return BaseResponse(
            success=False,
            message=f"获取用户列表失败: {str(e)}"
        )

# 删除用户
@app.delete("/api/users/{user_id}", response_model=BaseResponse)
async def delete_user(user_id: str):
    """删除用户"""
    if not face_recognition:
        raise HTTPException(status_code=503, detail="服务未就绪")
    
    try:
        result = face_recognition.delete_user(user_id)
        
        if result['success']:
            return BaseResponse(
                success=True,
                message=result['message']
            )
        else:
            return BaseResponse(
                success=False,
                message=result['message']
            )
            
    except Exception as e:
        logger.error(f"删除用户异常: {e}")
        return BaseResponse(
            success=False,
            message=f"删除用户失败: {str(e)}"
        )

# 根路径
@app.get("/")
async def root():
    """根路径，返回服务信息"""
    return {
        "service": "InsightFace 人脸识别服务",
        "version": "1.0.0",
        "status": "running",
        "modelStatus": "loaded" if face_recognition else "not loaded",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    logger.info("🚀 InsightFace 人脸识别服务启动中...")
    logger.info(f"📡 服务地址: http://0.0.0.0:3001")
    logger.info(f"📚 API 文档: http://0.0.0.0:3001/docs")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=3001,
        log_level="info"
    ) 