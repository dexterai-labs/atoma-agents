import { Application } from 'express';
import app from '../src/app';

declare global {
  var testApp: Application;
}

beforeAll(() => {
  global.testApp = app;
});

afterAll(async () => {
  // Add cleanup logic here if needed
}); 