const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const { combine, timestamp, printf, colorize, align } = winston.format;

// Fonction pour masquer les données sensibles
const maskSensitiveData = (input) => {
  if (typeof input === 'string') {
    // Masquer les mots de passe dans les strings JSON
    let output = input
      .replace(/"password":\s*".*?"/g, '"password": "***"')
      .replace(/"newPassword":\s*".*?"/g, '"newPassword": "***"')
      .replace(/"oldPassword":\s*".*?"/g, '"oldPassword": "***"')
      .replace(/"confirmPassword":\s*".*?"/g, '"confirmPassword": "***"')
      .replace(/"token":\s*".*?"/g, '"token": "***"')
      .replace(/"authorization":\s*".*?"/g, '"authorization": "***"')
      .replace(/"apiKey":\s*".*?"/g, '"apiKey": "***"')
      .replace(/password=.*?(&|$)/g, 'password=***$1')
      .replace(/token=.*?(&|$)/g, 'token=***$1')
      .replace(/authorization=.*?(&|$)/g, 'authorization=***$1');

    // Masquer les tokens JWT dans le texte
    output = output.replace(/(eyJ[a-zA-Z0-9_-]{5,}\.[a-zA-Z0-9_-]{5,}\.[a-zA-Z0-9_-]{5,})/g, '***');
    return output;
  }
  return input;
};

// Format personnalisé avec masquage des données sensibles
const customFormat = printf((info) => {
  let message = info.message;
  
  // Masquer les données sensibles
  if (typeof message === 'object') {
    try {
      message = JSON.parse(JSON.stringify(message));
      const sensitiveFields = ['password', 'token', 'authorization', 'apiKey', 'newPassword', 'oldPassword', 'confirmPassword'];
      sensitiveFields.forEach(field => {
        if (message[field]) {
          message[field] = '***';
        }
      });
      message = JSON.stringify(message);
    } catch (e) {
      message = String(message);
    }
  }
  
  message = maskSensitiveData(String(message));
  
  return `[${info.timestamp}] ${info.level}: ${message}`;
});

const logger = winston.createLogger({
  level: 'info',
  format: combine(
    colorize({ all: true }),
    timestamp({
      format: 'YYYY-MM-DD hh:mm:ss.SSS A',
    }),
    align(),
    customFormat
  ),
  transports: [
    new winston.transports.Console(),
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: combine(
        timestamp(),
        customFormat
      )
    }),
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: combine(
        timestamp(),
        customFormat
      )
    })
  ],
});

// Méthodes utilitaires pour une meilleure expérience de logging
logger.logRequest = (req) => {
  const { method, originalUrl, ip, headers, body } = req;
  logger.info('Requête entrante', {
    method,
    endpoint: originalUrl,
    ip,
    headers: {
      'user-agent': headers['user-agent'],
      // Autres headers non sensibles
    },
    body: maskSensitiveData(body)
  });
};

logger.logResponse = (res, data) => {
  logger.info('Réponse', {
    status: res.statusCode,
    data: maskSensitiveData(data)
  });
};

module.exports = logger;