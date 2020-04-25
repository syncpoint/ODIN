import dotenv from 'dotenv'

/*
  Quote from the 'dotenv' documentation:
  "config will read your .env file, parse the contents, assign it to process.env,
  and return an Object with a parsed key containing the loaded content or an error
  key if it failed."
*/
dotenv.config()

const config = {
  language: process.env.ODIN_LANGUAGE
}

export default config
