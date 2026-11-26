import { execFileSync } from 'node:child_process';

// LiftLog Project Status for an issue, shared by start-issue.mjs and finish-issue.mjs.
// Project, field and option IDs are looked up by name.
const OWNER = 'BraveHeart-tex';
const SCOPE_HINT =
  'Run `gh auth refresh -s project` to grant the project scope.';

export function run(command, args) {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      maxBuffer: 64 << 20,
      stdio: ['ignore', 'pipe', 'pipe']
    });
  } catch (error) {
    const stderr = String(error.stderr ?? '').trim();
    const scope =
      args[0] === 'project' && /scope/i.test(stderr) ? `\n${SCOPE_HINT}` : '';

    throw new Error(
      `${command} ${args.slice(0, 2).join(' ')} failed: ${stderr}${scope}`
    );
  }
}

const gh = (...args) => JSON.parse(run('gh', args));

function findProject() {
  const { projects } = gh(
    'project',
    'list',
    '--owner',
    OWNER,
    '--format',
    'json'
  );
  const project = projects.find(p => p.title === 'LiftLog');

  if (!project) {
    throw new Error(`LiftLog Project not found for ${OWNER}.\n${SCOPE_HINT}`);
  }

  return { ...project, number: String(project.number) };
}

const findItem = (project, issueUrl) =>
  gh(
    'project',
    'item-list',
    project.number,
    '--owner',
    OWNER,
    '--format',
    'json',
    '--limit',
    '1000'
  ).items.find(i => i.content?.url === issueUrl);

// Sets the issue's Status to the named option, adding the issue to the Project first.
export function setStatus(issueUrl, optionName) {
  const project = findProject();
  const { fields } = gh(
    'project',
    'field-list',
    project.number,
    '--owner',
    OWNER,
    '--format',
    'json'
  );
  const status = fields.find(field => field.name === 'Status');
  const option = status?.options?.find(o => o.name === optionName);

  if (!option) {
    throw new Error(
      `LiftLog Project has no Status option named ${optionName}.`
    );
  }

  const item =
    findItem(project, issueUrl) ??
    gh(
      'project',
      'item-add',
      project.number,
      '--owner',
      OWNER,
      '--url',
      issueUrl,
      '--format',
      'json'
    );
  run('gh', [
    ...['project', 'item-edit', '--id', item.id, '--project-id', project.id],
    ...['--field-id', status.id, '--single-select-option-id', option.id]
  ]);
}

// The issue's current Status option name, or null when it is not in the Project.
export function readStatus(issueUrl) {
  return findItem(findProject(), issueUrl)?.status ?? null;
}
