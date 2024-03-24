import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'

const execAsync = promisify(exec)

async function logCurrentServiceAccount () {
  try {
    const { stdout } = await execAsync('gcloud config get-value account')
    const lines = stdout.split('\n').filter(line => line.trim() !== '')
    const accountEmail = lines[lines.length - 1].trim()
    console.log(`Current service account: ${accountEmail}`)
  } catch (error) {
    console.error('Error fetching current service account:', error)
  }
}

async function createServiceAccount (projectId: string, serviceAccountId: string, displayName: string) {
  const command = `gcloud iam service-accounts create ${serviceAccountId} --project=${projectId} --display-name="${displayName}"`
  await execAsync(command)
  console.log(`Created service account: ${serviceAccountId}`)
}

async function bindGitHubRepoToServiceAccount (projectId: string, serviceAccountEmail: string, githubRepoRef: string, workloadIdentityPoolId: string) {
  const command = `gcloud iam service-accounts add-iam-policy-binding "${serviceAccountEmail}" --project="${projectId}" --role="roles/iam.workloadIdentityUser" --member="principalSet://iam.googleapis.com/${workloadIdentityPoolId}/attribute.repository/${githubRepoRef}"`
  await execAsync(command)
  console.log(`Bound GitHub repository ${githubRepoRef} to service account ${serviceAccountEmail}`)
}

async function createArtifactRegistryRepo (projectId: string, location: string, repositoryId: string, ownerTag: string) {
  const command = `gcloud artifacts repositories create ${repositoryId} --project=${projectId} --location=${location} --repository-format=docker --labels=owner=${ownerTag}`
  await execAsync(command)
  console.log(`Created Artifact Registry repository: ${repositoryId}`)
}

async function createCustomRole (projectId: string, roleId: string, title: string, description: string) {
  const yamlContent = `
title: "${title}"
description: "${description}"
stage: "ALPHA"
includedPermissions:
- artifactregistry.repositories.downloadArtifacts
- artifactregistry.repositories.uploadArtifacts
- artifactregistry.repositories.get
`.trim()

  const tempFilePath = `/tmp/${roleId}.yaml`
  await fs.writeFile(tempFilePath, yamlContent, 'utf8')

  const createCommand = `gcloud iam roles create ${roleId} --project=${projectId} --file=${tempFilePath}`
  await execAsync(createCommand)
  console.log(`Created custom role: ${roleId}`)

  await fs.unlink(tempFilePath)
}

async function grantCustomRoleToServiceAccount (projectId: string, serviceAccountId: string, serviceAccountEmail: string, roleId: string) {
  const condition = `
expression: resource.matchTag("${projectId}/owner", "${serviceAccountId}")
title: Limit access to resources owned by ${serviceAccountId}
`.trim()

  const tempFilePath = `/tmp/${roleId}-condition.yaml`
  await fs.writeFile(tempFilePath, condition, 'utf8')

  const command = `gcloud projects add-iam-policy-binding ${projectId} --member="serviceAccount:${serviceAccountEmail}" --role="projects/${projectId}/roles/${roleId}" --condition-from-file="${tempFilePath}"`
  await execAsync(command)
  console.log(`Granted custom role ${roleId} to ${serviceAccountEmail}`)

  await fs.unlink(tempFilePath)
}

export async function createServiceAccountAndResources (githubUsername: string) {
  const projectId = 'pokerai-417521'
  const serviceAccountId = githubUsername
  const displayName = githubUsername
  const serviceAccountEmail = `${githubUsername}@${projectId}.iam.gserviceaccount.com`
  const githubRepoRef = `${githubUsername}/poker-engine-2024`
  const workloadIdentityPoolId = 'projects/979321260256/locations/global/workloadIdentityPools/github'
  const location = 'us-east4'
  const repositoryId = githubUsername
  const roleId = `${githubUsername}Role`
  const roleTitle = roleId
  const roleDescription = `Custom role for ${githubUsername}`

  try {
    await logCurrentServiceAccount()
    // Step 1: Create a service account
    await createServiceAccount(projectId, serviceAccountId, displayName)

    // Step 2: Bind the GitHub repository to the service account
    await bindGitHubRepoToServiceAccount(projectId, serviceAccountEmail, githubRepoRef, workloadIdentityPoolId)

    // Step 3: Create an Artifact Registry repository with the owner tag
    await createArtifactRegistryRepo(projectId, location, repositoryId, githubUsername)

    // Step 4: Create a custom role with specific permissions
    await createCustomRole(projectId, roleId, roleTitle, roleDescription)

    // Step 5: Grant the custom role to the service account with a condition based on the owner tag
    await grantCustomRoleToServiceAccount(projectId, serviceAccountId, serviceAccountEmail, roleId)

    console.log('Service account and resources setup completed successfully.')
  } catch (error) {
    console.error('Error setting up the service account and resources:', error)
  }
}
