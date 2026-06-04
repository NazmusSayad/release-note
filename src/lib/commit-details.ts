import simpleGit from 'simple-git'

type GitCommitDetails = {
  hash: string
  email: string
  message: string
  time: string
  diff: string
}

export async function getGitCommitDetails(
  cwd: string,
  hash: string
): Promise<GitCommitDetails> {
  const git = simpleGit(cwd)
  const log = await git.log({ from: hash, to: hash })
  if (log.total === 0) {
    throw new Error(`No commit found for hash: ${hash}`)
  }
  return log.latest as GitCommitDetails
}
