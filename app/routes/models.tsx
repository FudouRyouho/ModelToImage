import { json } from '@remix-run/node';
import type { LoaderFunction } from '@remix-run/node';
import fs from 'fs';
import path from 'path';
import type { ModelInfo } from '~/types/models';

export const loader: LoaderFunction = async () => {
  const modelsDir = path.join(process.cwd(), 'public/assets/models');
  const models: ModelInfo[] = [];

  try {
    
    const directories = fs.readdirSync(modelsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const dir of directories) {
      const modelDir = path.join(modelsDir, dir);
      const files = fs.readdirSync(modelDir);
      
      const objFile = files.find(file => file.endsWith('.obj'));
      const mtlFile = files.find(file => file.endsWith('.mtl'));
      const textureFiles = files.filter(file => 
        /\.(png|jpg|jpeg|tga|bmp)$/i.test(file)
      );
      const metadataFile = files.find(file => file === 'metadata.json');
      let metadata = {};
      
      if (metadataFile) {
        try {
          const metadataContent = fs.readFileSync(
            path.join(modelDir, metadataFile),
            'utf-8'
          );
          metadata = JSON.parse(metadataContent);
        } catch (error) {
          console.warn(`Error reading metadata for ${dir}:`, error);
        }
      }

      if (objFile) {
        const modelInfo: ModelInfo = {
          name: dir,
          objPath: `/assets/models/${dir}/${objFile}`,
          mtlPath: mtlFile ? `/assets/models/${dir}/${mtlFile}` : null,
          texturePath: textureFiles.length 
            ? `/assets/models/${dir}/${textureFiles[0]}`
            : undefined,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined
        };
        
        models.push(modelInfo);
      }
    }

    return json(models);
  } catch (error) {
    console.error('Error scanning models:', error);
    return json({ error: 'Error scanning models directory' }, { status: 500 });
  }
};