import Anthropic from "@anthropic-ai/sdk";
import * as readline from "readline";

const client = new Anthropic();

// Caesar cipher functions
function caesarEncrypt(text, shift) {
  return text
    .split("")
    .map((char) => {
      if (char.match(/[a-z]/i)) {
        const code = char.charCodeAt(0);
        const base = code >= 97 ? 97 : 65; // lowercase or uppercase
        return String.fromCharCode(((code - base + shift) % 26) + base);
      }
      return char;
    })
    .join("");
}

function caesarDecrypt(text, shift) {
  return caesarEncrypt(text, (26 - (shift % 26)) % 26);
}

function bruteForceCrack(text) {
  const results = [];
  for (let shift = 0; shift < 26; shift++) {
    results.push({
      shift,
      decrypted: caesarDecrypt(text, shift),
    });
  }
  return results;
}

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log("🔐 Caesar Cipher Encryption/Decryption Tool");
  console.log("Using Claude AI to help identify encrypted messages\n");

  let continueSession = true;

  while (continueSession) {
    console.log("\nOptions:");
    console.log("1. Encrypt text");
    console.log("2. Decrypt text (with known shift)");
    console.log("3. Crack encrypted text (brute force + AI analysis)");
    console.log("4. Exit");

    const choice = await question("\nSelect option (1-4): ");

    switch (choice) {
      case "1": {
        const text = await question("Enter text to encrypt: ");
        const shiftStr = await question("Enter shift value (0-25): ");
        const shift = parseInt(shiftStr);

        if (isNaN(shift) || shift < 0 || shift > 25) {
          console.log("Invalid shift value. Please enter a number between 0-25.");
          break;
        }

        const encrypted = caesarEncrypt(text, shift);
        console.log(`\n✅ Encrypted text (shift ${shift}): ${encrypted}`);
        break;
      }

      case "2": {
        const text = await question("Enter text to decrypt: ");
        const shiftStr = await question("Enter shift value (0-25): ");
        const shift = parseInt(shiftStr);

        if (isNaN(shift) || shift < 0 || shift > 25) {
          console.log("Invalid shift value. Please enter a number between 0-25.");
          break;
        }

        const decrypted = caesarDecrypt(text, shift);
        console.log(`\n✅ Decrypted text: ${decrypted}`);
        break;
      }

      case "3": {
        const encryptedText = await question("Enter encrypted text to crack: ");

        console.log("\n🔄 Attempting to crack the cipher...\n");

        // Get all possible decryptions
        const possibilities = bruteForceCrack(encryptedText);

        // Use Claude to analyze the results
        console.log("📊 Analyzing possibilities with Claude AI...\n");

        const prompt = `You are a cryptanalysis expert. I have an encrypted text that was encrypted using a Caesar cipher.

Here are all 26 possible decryptions with their shift values:
${possibilities
  .map((p) => `Shift ${p.shift}: "${p.decrypted}"`)
  .join("\n")}

Please analyze these decryptions and:
1. Identify which one(s) look like valid English text
2. Explain why certain options are likely correct or incorrect
3. Provide the most probable original text and shift value

Consider factors like:
- Common English words and patterns
- Readability and coherence
- Frequency of common letters`;

        const message = await client.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        const analysisResult = message.content[0];
        if (analysisResult.type === "text") {
          console.log("🤖 Claude's Analysis:\n");
          console.log(analysisResult.text);
        }

        // Also show all possibilities
        console.log("\n📋 All Possibilities:\n");
        possibilities.forEach((p) => {
          console.log(`Shift ${p.shift.toString().padStart(2)}: ${p.decrypted}`);
        });

        break;
      }

      case "4": {
        continueSession = false;
        console.log(
          "\n👋 Goodbye! Remember: security through obscurity is not true security."
        );
        break;
      }

      default:
        console.log("Invalid option. Please select 1-4.");
    }
  }

  rl.close();
}

main();