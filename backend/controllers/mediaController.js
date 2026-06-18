import { put, del } from "@vercel/blob";
import MediaFile from "../models/MediaFile.js";
import Submission from "../models/Submission.js";
import path from "path";

// @desc    Upload media file
// @route   POST /api/media/upload
// @access  Private
export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { submissionId } = req.body;

    if (submissionId) {
      const submission = await Submission.findOne({
        _id: submissionId,
        company: req.companyId,
      });

      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
    }

    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${unique}${path.extname(req.file.originalname)}`;

    // Vercel Blob pe upload
    const blob = await put(filename, req.file.buffer, {
      access: "public",
      contentType: req.file.mimetype,
    });

    const mediaFile = await MediaFile.create({
      company: req.companyId,
      submission: submissionId || null,
      uploadedBy: req.user._id,
      filename: filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      path: blob.url, // ab yahan Blob ka full URL store hoga
    });

    if (submissionId) {
      await Submission.findByIdAndUpdate(submissionId, {
        $addToSet: { mediaFiles: mediaFile._id },
      });
    }

    res.status(201).json({
      _id: mediaFile._id,
      filename: mediaFile.filename,
      originalName: mediaFile.originalName,
      mimeType: mediaFile.mimeType,
      sizeBytes: mediaFile.sizeBytes,
      url: blob.url,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get media files for a submission
// @route   GET /api/media/submission/:submissionId
// @access  Private
export const getMediaBySubmission = async (req, res) => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.submissionId,
      company: req.companyId,
    });

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const files = await MediaFile.find({
      submission: req.params.submissionId,
      company: req.companyId,
    });

    res.json(
      files.map((f) => ({
        _id: f._id,
        filename: f.filename,
        originalName: f.originalName,
        mimeType: f.mimeType,
        sizeBytes: f.sizeBytes,
        url: f.path, // pehle se full Blob URL hai
        createdAt: f.createdAt,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete media file
// @route   DELETE /api/media/:id
// @access  Private — company_admin
export const deleteMedia = async (req, res) => {
  try {
    const file = await MediaFile.findOne({
      _id: req.params.id,
      company: req.companyId,
    });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Vercel Blob se file delete
    await del(file.path);

    if (file.submission) {
      await Submission.findByIdAndUpdate(file.submission, {
        $pull: { mediaFiles: file._id },
      });
    }

    await file.deleteOne();
    res.json({ message: "File deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};