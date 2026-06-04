import { Prettify } from 'daily-code'
import { DefaultLogFields, ListLogLine, simpleGit } from 'simple-git'

export async function getGitCommitsInfo(
  cwd: string,
  prev: string,
  current: string
): Promise<Prettify<DefaultLogFields & ListLogLine>[]> {
  const git = simpleGit(cwd)
  const log = await git.log({ from: prev, to: current })
  return [...log.all]
}
