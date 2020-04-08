# Dependabot Deploy GitHub action

## Inputs

### `gitHubToken`

**Required** GitHub token for current action.

### maxDeployVersion

The maximum difference in version which should be auto-deployed. Allowed values `PATCH`, `MINOR`, `MAJOR`. Default `MINOR`.

### `deployDevDependencies`

TODO: So far ignored
If true then dev dependencies will be deployed automatically. Default `true`.

### `deployDependencies`

TODO: So far ignored
If true then production dependencies will be deployed automatically. Default `false`.
