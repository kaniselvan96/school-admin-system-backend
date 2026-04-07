import multer from 'multer';
import path from 'path';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const diskStorage = multer.diskStorage({
  destination: '/tmp/school-administration-system-uploads',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now());
  },
});

const csvFileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.csv' || file.mimetype === 'text/csv') {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'));
  }
};

const upload = multer({
  storage: diskStorage,
  fileFilter: csvFileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

export default upload;
