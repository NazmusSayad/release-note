#!/usr/bin/env node

import { createArgs } from './args.js'

void createArgs().then((p) => p.parse())
