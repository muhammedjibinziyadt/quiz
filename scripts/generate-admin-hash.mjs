#!/usr/bin/env node
import bcrypt from "bcryptjs";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const password = process.argv[2];

if (password) {
  generate(password);
  process.exit(0);
} else {
  rl.question("Enter admin password to hash: ", (answer) => {
    if (!answer || answer.trim().length < 6) {
      console.error("Error: Password should be at least 6 characters long.");
      process.exit(1);
    }
    generate(answer.trim());
    rl.close();
  });
}

function generate(pwd) {
  const saltRounds = 10;
  const hash = bcrypt.hashSync(pwd, saltRounds);
  console.log("\n=======================================================");
  console.log("🔐 Generated Admin Password Hash for MAERIKA 2K26:");
  console.log("=======================================================");
  console.log(`Password: ${pwd}`);
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log("=======================================================\n");
  console.log("Add this to your .env.local file:");
  console.log(`ADMIN_USERNAME=admin`);
  console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
}
