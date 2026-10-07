import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./tests',fullyParallel:false,workers:1,reporter:'list',timeout:30000,use:{baseURL:'http://127.0.0.1:5173',channel:'msedge',viewport:{width:1200,height:1000},screenshot:'only-on-failure',trace:'retain-on-failure'},webServer:{command:'pnpm run dev',url:'http://127.0.0.1:5173',reuseExistingServer:true}});
