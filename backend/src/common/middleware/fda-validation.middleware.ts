import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class FDAValidationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.path.includes('process-fda-label') && req.method === 'POST') {
      const body = req.body;
      
      if (!body) {
        throw new BadRequestException('Request body is required');
      }

      if (body.fdaLabel && typeof body.fdaLabel !== 'object') {
        throw new BadRequestException('FDA label data must be an object');
      }

      if (body.drugId && typeof body.drugId !== 'string') {
        throw new BadRequestException('Drug ID must be a string');
      }

      this.validateFDALabelStructure(body.fdaLabel || body);
    }
    
    next();
  }

  private validateFDALabelStructure(fdaLabel: any) {
    if (!fdaLabel) return;

    try {
      if (fdaLabel.generic_name && typeof fdaLabel.generic_name !== 'string') {
        console.warn('Invalid generic_name format, skipping');
        fdaLabel.generic_name = null;
      }

      if (fdaLabel.brand_name && typeof fdaLabel.brand_name !== 'string') {
        console.warn('Invalid brand_name format, skipping');
        fdaLabel.brand_name = null;
      }

      if (fdaLabel.manufacturer && typeof fdaLabel.manufacturer !== 'string') {
        console.warn('Invalid manufacturer format, skipping');
        fdaLabel.manufacturer = null;
      }

      if (fdaLabel.brand_name_suffix && !Array.isArray(fdaLabel.brand_name_suffix)) {
        console.warn('Invalid brand_name_suffix format, converting to array or null');
        fdaLabel.brand_name_suffix = fdaLabel.brand_name_suffix ? [fdaLabel.brand_name_suffix] : null;
      }

      this.sanitizeNestedObjects(fdaLabel);
    } catch (error) {
      console.warn('Error validating FDA label structure:', error.message);
    }
  }

  private sanitizeNestedObjects(obj: any) {
    if (!obj || typeof obj !== 'object') return;

    Object.keys(obj).forEach(key => {
      const value = obj[key];
      
      if (value === null || value === undefined) {
        return;
      }

      if (typeof value === 'object' && !Array.isArray(value)) {
        this.sanitizeNestedObjects(value);
      }
      
      if (Array.isArray(value)) {
        obj[key] = value.filter(item => {
          if (typeof item === 'string') return item.trim().length > 0;
          return item !== null && item !== undefined;
        });
      }
    });
  }
}