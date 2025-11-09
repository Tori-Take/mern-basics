const express = require('express');
const router = express.Router();
const auth = require('../../core/middleware/auth');
const SnapSphereController = require('./snapsphere.controllers');

/**
 * @route   GET /api/snapsphere/ping
 * @desc    Cloudinaryへの接続をテストする
 * @access  Private
 */
router.get('/ping', auth, SnapSphereController.pingCloudinary);

/**
 * @route   POST /api/snapsphere/upload-signature
 * @desc    Cloudinaryへの署名付きアップロードのための署名とパラメータを生成する
 * @access  Private
 */
router.post('/upload-signature', auth, SnapSphereController.generateUploadSignature);

/**
 * @route   POST /api/snapsphere/posts
 * @desc    新しい写真投稿を作成する
 * @access  Private
 */
router.post('/posts', auth, SnapSphereController.createPost);

/**
 * @route   GET /api/snapsphere/posts
 * @desc    写真投稿の一覧を取得する
 * @access  Private
 */
router.get('/posts', auth, SnapSphereController.getPosts);


module.exports = router;
