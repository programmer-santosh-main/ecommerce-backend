import fileUpload from 'express-fileupload';

const fileUploadMiddleware = fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/', // Uses system temp directory
  createParentPath: true,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  abortOnLimit: true,
  safeFileNames: true,
  preserveExtension: 4,
  parseNested: true
});

export default fileUploadMiddleware;