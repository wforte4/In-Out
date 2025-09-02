#!/usr/bin/env node

// Generate Prisma client after install
const { exec } = require('child_process');

console.log('Generating Prisma client...');
exec('bunx prisma generate', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error generating Prisma client: ${error}`);
    return;
  }
  console.log('Prisma client generated successfully');
  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);
});