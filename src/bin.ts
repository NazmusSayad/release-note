#!/usr/bin/env node

import { createArgs } from './args.js'

const program = createArgs()
program.parse()
