export class DataSanitizer {
  static sanitizeString(value: any): string | null {
    if (value === null || value === undefined) return null;
    
    if (typeof value === 'string') {
      const cleaned = value.trim();
      return cleaned.length > 0 ? cleaned : null;
    }
    
    if (typeof value === 'number') {
      return value.toString();
    }
    
    return null;
  }

  static sanitizeArray(value: any): string[] | null {
    if (value === null || value === undefined) return null;
    
    if (Array.isArray(value)) {
      const cleaned = value
        .map(item => this.sanitizeString(item))
        .filter(item => item !== null);
      
      return cleaned.length > 0 ? cleaned : null;
    }
    
    if (typeof value === 'string' && value.trim()) {
      return [value.trim()];
    }
    
    return null;
  }

  static sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      return null;
    }

    const sanitized = {};
    let hasValidData = false;

    Object.keys(obj).forEach(key => {
      const value = obj[key];
      
      if (value === null || value === undefined) {
        return;
      }

      if (typeof value === 'string') {
        const cleaned = this.sanitizeString(value);
        if (cleaned) {
          sanitized[key] = cleaned;
          hasValidData = true;
        }
      } else if (Array.isArray(value)) {
        const cleaned = this.sanitizeArray(value);
        if (cleaned) {
          sanitized[key] = cleaned;
          hasValidData = true;
        }
      } else if (typeof value === 'object') {
        const cleaned = this.sanitizeObject(value);
        if (cleaned) {
          sanitized[key] = cleaned;
          hasValidData = true;
        }
      } else {
        sanitized[key] = value;
        hasValidData = true;
      }
    });

    return hasValidData ? sanitized : null;
  }

  static extractTextContent(section: any): string | null {
    if (!section) return null;

    if (typeof section === 'string') {
      return this.sanitizeString(section);
    }

    if (typeof section === 'object') {
      if (section.text) {
        return this.sanitizeString(section.text);
      }
      
      if (section.items && Array.isArray(section.items)) {
        const validItems = section.items
          .map(item => this.sanitizeString(item))
          .filter(item => item !== null);
        
        return validItems.length > 0 ? validItems.join('. ') : null;
      }
      
      const firstTextValue = Object.values(section).find(value => 
        typeof value === 'string' && value.trim()
      );
      
      if (firstTextValue) {
        return this.sanitizeString(firstTextValue);
      }
    }

    return null;
  }

  static validateAndCleanFDALabel(fdaLabel: any): any {
    if (!fdaLabel || typeof fdaLabel !== 'object') {
      return null;
    }

    const cleaned = {
      generic_name: this.sanitizeString(fdaLabel.generic_name),
      brand_name: this.sanitizeString(fdaLabel.brand_name),
      brand_name_suffix: this.sanitizeArray(fdaLabel.brand_name_suffix),
      manufacturer: this.sanitizeString(fdaLabel.manufacturer),
      route: this.sanitizeString(fdaLabel.route),
      indications: this.sanitizeObject(fdaLabel.indications),
      contraindications: this.sanitizeObject(fdaLabel.contraindications),
      warnings: this.sanitizeObject(fdaLabel.warnings),
      dosage: this.sanitizeObject(fdaLabel.dosage),
      adverse_reactions: this.sanitizeObject(fdaLabel.adverse_reactions),
      raw_data: fdaLabel.raw_data || fdaLabel,
    };

    const hasAnyData = Object.values(cleaned).some(value => 
      value !== null && value !== undefined
    );

    return hasAnyData ? cleaned : null;
  }
}