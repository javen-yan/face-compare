#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
基于 InsightFace 的人脸识别模块
提供人脸特征提取、对比和验证功能
"""

import cv2
import numpy as np
from insightface.app import FaceAnalysis
import base64
import io
from PIL import Image
import os
import pickle
from typing import Dict, Tuple, Optional
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class InsightFaceRecognition:
    def __init__(self, model_path: str = None):
        """
        初始化 InsightFace 人脸识别系统
        
        Args:
            model_path: 模型文件路径，如果为 None 则使用默认模型
        """
        try:
            # 初始化 InsightFace 应用
            self.app = FaceAnalysis(name='buffalo_l', providers=['CUDAExecutionProvider', 'CPUExecutionProvider'])
            self.app.prepare(ctx_id=0, det_size=(640, 640))
            
            # 存储用户人脸特征
            self.user_embeddings: Dict[str, np.ndarray] = {}
            self.user_faces: Dict[str, Dict] = {}
            
            # 加载已保存的用户数据
            self.load_user_data()
            
            logger.info("InsightFace 人脸识别系统初始化成功")
            
        except Exception as e:
            logger.error(f"初始化失败: {e}")
            raise
    
    def load_user_data(self):
        """加载已保存的用户数据"""
        try:
            if os.path.exists('user_data.pkl'):
                with open('user_data.pkl', 'rb') as f:
                    data = pickle.load(f)
                    self.user_embeddings = data.get('embeddings', {})
                    self.user_faces = data.get('faces', {})
                logger.info(f"加载了 {len(self.user_embeddings)} 个用户的人脸数据")
        except Exception as e:
            logger.warning(f"加载用户数据失败: {e}")
    
    def save_user_data(self):
        """保存用户数据到文件"""
        try:
            data = {
                'embeddings': self.user_embeddings,
                'faces': self.user_faces
            }
            with open('user_data.pkl', 'wb') as f:
                pickle.dump(data, f)
            logger.info("用户数据保存成功")
        except Exception as e:
            logger.error(f"保存用户数据失败: {e}")
    
    def base64_to_image(self, base64_data: str) -> np.ndarray:
        """
        将 base64 编码的图片转换为 OpenCV 格式
        
        Args:
            base64_data: base64 编码的图片数据
            
        Returns:
            OpenCV 格式的图片数组
        """
        try:
            # 移除 data:image/jpeg;base64, 前缀
            if ',' in base64_data:
                base64_data = base64_data.split(',')[1]
            
            # 解码 base64
            image_data = base64.b64decode(base64_data)
            
            # 转换为 PIL Image
            image = Image.open(io.BytesIO(image_data))
            
            # 转换为 OpenCV 格式 (BGR)
            image_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            return image_cv
            
        except Exception as e:
            logger.error(f"图片转换失败: {e}")
            raise ValueError(f"无效的图片数据: {e}")
    
    def detect_and_extract_face(self, image: np.ndarray) -> Tuple[Optional[np.ndarray], Optional[np.ndarray]]:
        """
        检测图片中的人脸并提取特征
        
        Args:
            image: 输入图片
            
        Returns:
            (人脸图片, 特征向量) 的元组，如果没有检测到人脸则返回 (None, None)
        """
        try:
            # 使用 InsightFace 检测人脸
            faces = self.app.get(image)
            
            if not faces:
                logger.warning("未检测到人脸")
                return None, None
            
            # 获取最大的人脸（通常是最清晰的主脸）
            face = max(faces, key=lambda x: x.bbox[2] * x.bbox[3])
            
            # 提取特征向量
            embedding = face.embedding
            
            # 获取人脸区域
            bbox = face.bbox.astype(int)
            x1, y1, x2, y2 = bbox[0], bbox[1], bbox[2], bbox[3]
            
            # 裁剪人脸区域
            face_img = image[y1:y2, x1:x2]
            
            logger.info(f"检测到人脸，尺寸: {face_img.shape}")
            
            return face_img, embedding
            
        except Exception as e:
            logger.error(f"人脸检测和特征提取失败: {e}")
            return None, None
    
    def register_face(self, user_id: str, image_data: str) -> Dict:
        """
        注册用户人脸
        
        Args:
            user_id: 用户ID
            image_data: base64 编码的图片数据
            
        Returns:
            注册结果
        """
        try:
            # 转换图片格式
            image = self.base64_to_image(image_data)
            
            # 检测人脸并提取特征
            face_img, embedding = self.detect_and_extract_face(image)
            
            if face_img is None or embedding is None:
                return {
                    'success': False,
                    'message': '未检测到人脸或人脸检测失败'
                }
            
            # 检查是否已存在该用户
            if user_id in self.user_embeddings:
                return {
                    'success': False,
                    'message': '用户已存在，请使用不同的用户ID'
                }
            
            # 存储用户数据
            self.user_embeddings[user_id] = embedding
            self.user_faces[user_id] = {
                'face_image': face_img,
                'created_at': str(np.datetime64('now')),
                'image_size': face_img.shape
            }
            
            # 保存到文件
            self.save_user_data()
            
            logger.info(f"用户 {user_id} 人脸注册成功")
            
            return {
                'success': True,
                'message': '人脸注册成功',
                'data': {
                    'userId': user_id,
                    'faceData': 'registered',
                    'faceCount': len(self.user_embeddings)
                }
            }
            
        except Exception as e:
            logger.error(f"人脸注册失败: {e}")
            return {
                'success': False,
                'message': f'人脸注册失败: {str(e)}'
            }
    
    def compare_faces(self, user_id: str, image_data: str, threshold: float = 0.6) -> Dict:
        """
        对比人脸
        
        Args:
            user_id: 用户ID
            image_data: base64 编码的待对比图片
            threshold: 相似度阈值，默认 0.6
            
        Returns:
            对比结果
        """
        try:
            # 检查用户是否存在
            if user_id not in self.user_embeddings:
                return {
                    'success': False,
                    'message': '用户不存在，请先注册'
                }
            
            # 转换图片格式
            image = self.base64_to_image(image_data)
            
            # 检测人脸并提取特征
            face_img, embedding = self.detect_and_extract_face(image)
            
            if face_img is None or embedding is None:
                return {
                    'success': False,
                    'message': '未检测到人脸或人脸检测失败'
                }
            
            # 获取已存储的特征向量
            stored_embedding = self.user_embeddings[user_id]
            
            # 计算余弦相似度
            similarity = self.cosine_similarity(embedding, stored_embedding)
            
            # 判断是否匹配
            is_match = similarity >= threshold
            
            # 计算置信度（基于相似度）
            confidence = min(similarity * 1.2, 1.0)  # 置信度略高于相似度，但不超过1
            
            logger.info(f"用户 {user_id} 人脸对比完成，相似度: {similarity:.4f}, 匹配: {is_match}")
            
            return {
                'success': True,
                'message': '人脸对比完成',
                'data': {
                    'similarity': float(similarity),
                    'isMatch': bool(is_match),
                    'confidence': float(confidence),
                    'threshold': threshold
                }
            }
            
        except Exception as e:
            logger.error(f"人脸对比失败: {e}")
            return {
                'success': False,
                'message': f'人脸对比失败: {str(e)}'
            }
    
    def cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """
        计算两个向量的余弦相似度
        
        Args:
            vec1: 向量1
            vec2: 向量2
            
        Returns:
            余弦相似度 (0-1)
        """
        try:
            # 归一化向量
            vec1_norm = vec1 / np.linalg.norm(vec1)
            vec2_norm = vec2 / np.linalg.norm(vec2)
            
            # 计算余弦相似度
            similarity = np.dot(vec1_norm, vec2_norm)
            
            # 确保结果在 [0, 1] 范围内
            similarity = max(0.0, min(1.0, similarity))
            
            return similarity
            
        except Exception as e:
            logger.error(f"计算相似度失败: {e}")
            return 0.0
    
    def get_user_info(self, user_id: str) -> Dict:
        """
        获取用户信息
        
        Args:
            user_id: 用户ID
            
        Returns:
            用户信息
        """
        if user_id not in self.user_faces:
            return {
                'success': False,
                'message': '用户不存在'
            }
        
        user_info = self.user_faces[user_id]
        return {
            'success': True,
            'message': '获取用户信息成功',
            'data': {
                'userId': user_id,
                'createdAt': user_info['created_at'],
                'imageSize': user_info['image_size']
            }
        }
    
    def get_all_users(self) -> Dict:
        """
        获取所有用户信息
        
        Returns:
            所有用户信息
        """
        user_list = []
        for user_id, user_info in self.user_faces.items():
            user_list.append({
                'userId': user_id,
                'createdAt': user_info['created_at'],
                'imageSize': user_info['image_size']
            })
        
        return {
            'success': True,
            'message': '获取所有用户信息成功',
            'data': {
                'users': user_list,
                'totalCount': len(user_list)
            }
        }
    
    def delete_user(self, user_id: str) -> Dict:
        """
        删除用户
        
        Args:
            user_id: 用户ID
            
        Returns:
            删除结果
        """
        try:
            if user_id in self.user_embeddings:
                del self.user_embeddings[user_id]
                del self.user_faces[user_id]
                
                # 保存到文件
                self.save_user_data()
                
                logger.info(f"用户 {user_id} 删除成功")
                
                return {
                    'success': True,
                    'message': '用户删除成功'
                }
            else:
                return {
                    'success': False,
                    'message': '用户不存在'
                }
                
        except Exception as e:
            logger.error(f"删除用户失败: {e}")
            return {
                'success': False,
                'message': f'删除用户失败: {str(e)}'
            }
    
    def health_check(self) -> Dict:
        """
        健康检查
        
        Returns:
            系统状态信息
        """
        return {
            'status': 'healthy',
            'timestamp': str(np.datetime64('now')),
            'userCount': len(self.user_embeddings),
            'modelLoaded': hasattr(self, 'app')
        }

# 全局实例
face_recognition = None

def get_face_recognition_instance():
    """获取人脸识别实例的单例"""
    global face_recognition
    if face_recognition is None:
        face_recognition = InsightFaceRecognition()
    return face_recognition

if __name__ == "__main__":
    # 测试代码
    try:
        fr = InsightFaceRecognition()
        print("InsightFace 人脸识别系统测试成功")
        print(f"健康状态: {fr.health_check()}")
    except Exception as e:
        print(f"测试失败: {e}") 