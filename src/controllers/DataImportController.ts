import Express, { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import Logger from '../config/logger';
import upload from '../config/multer';
import { convertCsvToJson } from '../utils';

const DataImportController = Express.Router();
const LOG = new Logger('DataImportController.js');

// TODO: Please implement Question 1 requirement here
const dataImportHandler: RequestHandler = async (req, res) => {
  const { file } = req;

  const data = await convertCsvToJson(file.path);
  LOG.info(JSON.stringify(data, null, 2));

  return res.sendStatus(StatusCodes.NO_CONTENT);
};

DataImportController.post('/upload2', upload.single('data'), dataImportHandler);

export default DataImportController;
