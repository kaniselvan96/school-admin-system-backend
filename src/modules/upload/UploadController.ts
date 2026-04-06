import Express, { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import fs from 'fs';
import Logger from '../../shared/config/logger';
import upload from '../../shared/config/multer';
import { convertCsvToJson } from '../../shared/utils';
import { UploadService } from './UploadService';

const UploadController = Express.Router();
const LOG = new Logger('UploadController.js');
const uploadService = new UploadService();

const uploadHandler: RequestHandler = async (req, res) => {
  const filePath = req.file?.path;

  try {
    const { file } = req;

    if (!file) {
      LOG.warn('No file uploaded');
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: 'No file uploaded' });
    }

    // validates that the uploaded file actually exists on the disk
    if (!fs.existsSync(file.path)) {
      LOG.error(`Uploaded file not found at path: ${file.path}`);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to process file upload',
        details: 'File not found after upload',
      });
    }

    LOG.info(`File uploaded: ${file.originalname}, path: ${file.path}`);

    try {
      const data = await convertCsvToJson(file.path);
      LOG.info(`CSV parsed successfully: ${data.length} rows`);

      // Process the CSV data
      await uploadService.processCsvData(data);

      LOG.info('CSV data uploaded to database successfully');
      return res.sendStatus(StatusCodes.NO_CONTENT);
    } catch (csvError) {
      const errorMsg =
        csvError instanceof Error ? csvError.message : String(csvError);
      LOG.error(`CSV processing error: ${errorMsg}`);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to process file upload',
        details: errorMsg,
      });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    LOG.error(`Unexpected error during file upload: ${errorMsg}`);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to process file upload',
      details: errorMsg,
    });
  } finally {
    // Clean up the uploaded file
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        LOG.info(`Cleaned up uploaded file: ${filePath}`);
      } catch (cleanupError) {
        const cleanupMsg =
          cleanupError instanceof Error
            ? cleanupError.message
            : String(cleanupError);
        LOG.warn(`Failed to clean up file ${filePath}: ${cleanupMsg}`);
      }
    }
  }
};

UploadController.post('/upload', upload.single('data'), uploadHandler);

export default UploadController;
