import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function createServiceAccount (projectId: string, serviceAccountId: string, displayName: string) {
  const command = `gcloud iam service-accounts create ${serviceAccountId} --project=${projectId} --display-name="${displayName}"`
  const { stdout } = await execAsync(command)
  const serviceAccountEmail = stdout.trim()
  console.log(`Created service account: ${serviceAccountEmail}`)
  return serviceAccountEmail
}

async function bindGitHubRepoToServiceAccount (projectId: string, serviceAccountEmail: string, githubRepoRef: string, workloadIdentityPoolId: string) {
  const command = `gcloud iam service-accounts add-iam-policy-binding "${serviceAccountEmail}" --project="${projectId}" --role="roles/iam.workloadIdentityUser" --member="principalSet://iam.googleapis.com/${workloadIdentityPoolId}/attribute.repository/${githubRepoRef}"`
  await execAsync(command)
  console.log(`Bound GitHub repository ${githubRepoRef} to service account ${serviceAccountEmail}`)
}

async function createArtifactRegistryRepo (projectId: string, location: string, repositoryId: string) {
  const command = `gcloud artifacts repositories create ${repositoryId} --project=${projectId} --location=${location} --repository-format=docker`
  await execAsync(command)
  console.log(`Created Artifact Registry repository: ${repositoryId}`)
}

async function createCustomRole (projectId: string, roleId: string, title: string, description: string, repositoryName: string) {
  const command = `gcloud iam roles create ${roleId} --project=${projectId} --title="${title}" --description="${description}" --permissions=artifactregistry.repositories.uploadArtifacts,artifactregistry.repositories.downloadArtifacts --condition='resource.name.startsWith("projects/${projectId}/locations/*/repositories/${repositoryName}")'`
  await execAsync(command)
  console.log(`Created custom role: ${roleId}`)
}

async function grantCustomRoleToServiceAccount (projectId: string, serviceAccountEmail: string, roleId: string) {
  const command = `gcloud projects add-iam-policy-binding ${projectId} --member="serviceAccount:${serviceAccountEmail}" --role="projects/${projectId}/roles/${roleId}"`
  await execAsync(command)
  console.log(`Granted custom role ${roleId} to ${serviceAccountEmail}`)
}

export async function createServiceAccountAndResources (githubUsername: string) {
  const projectId = 'pokerai-417521'
  const serviceAccountId = githubUsername
  const displayName = githubUsername
  const githubRepoRef = `${githubUsername}/poker-engine-2024`
  const workloadIdentityPoolId = 'projects/979321260256/locations/global/workloadIdentityPools/github'
  const location = 'us-east4'
  const repositoryId = githubUsername
  const roleId = `${githubUsername}Role`
  const roleTitle = roleId
  const roleDescription = `Custom role for ${githubUsername}`

  try {
    // Step 1: Create a service account
    const serviceAccountEmail = await createServiceAccount(projectId, serviceAccountId, displayName)

    // Step 2: Bind the GitHub repository to the service account
    await bindGitHubRepoToServiceAccount(projectId, serviceAccountEmail, githubRepoRef, workloadIdentityPoolId)

    // Step 3: Create an Artifact Registry repository
    await createArtifactRegistryRepo(projectId, location, repositoryId)

    // Step 4: Create a custom role with specific permissions
    await createCustomRole(projectId, roleId, roleTitle, roleDescription, repositoryId)

    // Step 5: Grant the custom role to the service account
    await grantCustomRoleToServiceAccount(projectId, serviceAccountEmail, roleId)

    console.log('Service account and resources setup completed successfully.')
  } catch (error) {
    console.error('Error setting up the service account and resources:', error)
  }
}