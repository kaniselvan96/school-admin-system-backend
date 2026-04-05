import Express, { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import Logger from '../../shared/config/logger';
import upload from '../../shared/config/multer';
import { convertCsvToJson } from '../../shared/utils';
import { UploadService } from './UploadService';

const UploadController = Express.Router();
const LOG = new Logger('UploadController.js');
const uploadService = new UploadService();

const uploadHandler: RequestHandler = async (req, res) => {
  try {
    const { file } = req;

    if (!file) {
      LOG.warn('No file uploaded');
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: 'No file uploaded' });
    } else {
      LOG.info(`File uploaded: ${file.originalname}`);
      const data = await convertCsvToJson(file.path);

      // Process the CSV data
      await uploadService.processCsvData(data);

      LOG.info('CSV data uploaded to database successfully');
      return res.sendStatus(StatusCodes.NO_CONTENT);
    }
  } catch (error) {
    LOG.error(`Error processing file upload: ${error}`);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: 'Failed to process file upload' });
  }
};

UploadController.post('/upload', upload.single('data'), uploadHandler);

export default UploadController;
