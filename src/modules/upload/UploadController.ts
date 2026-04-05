import Express, { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import Logger from '../../config/logger';
import upload from '../../config/multer';
import { convertCsvToJson } from '../../utils';

const UploadController = Express.Router();
const LOG = new Logger('UploadController.js');

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
