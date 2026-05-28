import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

export const uploadToS3 = async (file, folder = 'products') => {
  const ext = file.originalname.split('.').pop();
  const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));
  return `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION || 'ap-southeast-1'}.amazonaws.com/${key}`;
};

export const deleteFromS3 = async (url) => {
  if (!url || !url.includes('amazonaws.com')) return;
  const key = url.split('.amazonaws.com/')[1];
  await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
};
