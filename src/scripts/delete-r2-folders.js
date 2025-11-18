const { S3Client, ListObjectsV2Command, DeleteObjectCommand } = require("@aws-sdk/client-s3");
require('dotenv').config();

// Configure the S3 client for R2
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.NEXT_PUBLIC_R2_ENDPOINT || process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY,
  }
});

const bucketName = process.env.NEXT_PUBLIC_R2_BUCKET_NAME || process.env.R2_BUCKET_NAME;
const foldersToDelete = ["tunetalez/BackgroundMusic/"];

async function deleteFolder(folder) {
  console.log(`Deleting folder: ${folder}`);
  
  // List all objects with the folder prefix
  const listCommand = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: folder
  });
  
  try {
    const listedObjects = await s3.send(listCommand);
    
    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      console.log(`No objects found in ${folder}`);
      return;
    }
    
    console.log(`Found ${listedObjects.Contents.length} objects in ${folder}`);
    
    // Delete each object
    for (const object of listedObjects.Contents) {
      console.log(`Deleting: ${object.Key}`);
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: object.Key
      });
      await s3.send(deleteCommand);
    }
    
    // Check if there are more objects (pagination)
    if (listedObjects.IsTruncated) {
      console.log(`More objects exist in ${folder}. Consider running the script again.`);
    }
    
    console.log(`Successfully deleted objects in folder: ${folder}`);
  } catch (err) {
    console.error(`Error deleting folder ${folder}:`, err);
  }
}

async function listAllObjects() {
  console.log("Listing all objects in the bucket to find available folders...");
  
  const listCommand = new ListObjectsV2Command({
    Bucket: bucketName,
    Delimiter: '/'
  });
  
  try {
    const listedObjects = await s3.send(listCommand);
    
    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      console.log("No objects found in the bucket");
      return;
    }
    
    console.log("Found objects:");
    listedObjects.Contents.forEach(obj => {
      console.log(`- ${obj.Key}`);
    });
    
    if (listedObjects.CommonPrefixes && listedObjects.CommonPrefixes.length > 0) {
      console.log("Found prefixes (folders):");
      listedObjects.CommonPrefixes.forEach(prefix => {
        console.log(`- ${prefix.Prefix}`);
      });
    }
  } catch (err) {
    console.error("Error listing objects:", err);
  }
}

async function deleteAllFolders() {
  if (!bucketName) {
    console.error("Error: R2 bucket name not found in environment variables");
    console.error("Please set NEXT_PUBLIC_R2_BUCKET or R2_BUCKET environment variable");
    process.exit(1);
  }
  
  console.log(`Using bucket: ${bucketName}`);
  
  // First list all objects to see what's available
  await listAllObjects();
  
  console.log(`Folders to delete: ${foldersToDelete.join(", ")}`);
  
  for (const folder of foldersToDelete) {
    await deleteFolder(folder);
  }
  
  console.log("Deletion process completed");
}

deleteAllFolders();