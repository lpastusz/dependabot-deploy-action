# Dependabot Deploy GitHub action

## Inputs

#### gitHubToken (required)

GitHub token for current action.

#### maxDeployVersion

The maximum difference in version which should be auto-deployed. Allowed values `PATCH`, `MINOR`, `MAJOR`. Defaults to `MINOR`.

#### deployDevDependencies (TODO: So far not working)

Sets if dev dependencies will be deployed automatically. Defaults to `true`.

#### deployDependencies (TODO: So far not working)

Sets if production dependencies will be deployed automatically. Defaults to `false`.

## Usage

Create an yml file into `.github/workflows/<WORKFLOW_NAME>.yml`

```yml
on: [check_suite]

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Dependabot auto deploy dependencies
    steps:
      - name: Deploy
        uses: lpastusz/dependabot-deploy-action@master
        with:
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```
