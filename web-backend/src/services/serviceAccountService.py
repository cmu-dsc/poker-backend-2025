from google.cloud import iam, artifactregistry_v1
from google.cloud.iam_admin_v1.services.iam import IAMClient
from google.cloud.iam_admin_v1.types import CreateServiceAccountRequest, ServiceAccount
from google.cloud.artifactregistry_v1 import ArtifactRegistryClient
from google.cloud.artifactregistry_v1.types import Repository

def create_service_account(iam_client, project_id, service_account_id):
    """Create a new service account."""
    service_account = iam_client.create_service_account(
        request=CreateServiceAccountRequest(
            name=f"projects/{project_id}",
            account_id=service_account_id,
            service_account=ServiceAccount(display_name=github_username)
        )
    )
    print(f"Created service account: {service_account.email}")
    return service_account.email

def grant_artifact_registry_admin_role(iam_client, project_id, service_account_email):
    """Grant Artifact Registry Admin role to the service account."""
    policy = iam_client.get_iam_policy(resource=f"projects/{project_id}")
    binding = next((b for b in policy.bindings if b.role == "roles/artifactregistry.admin"), None)
    if binding:
        if service_account_email not in binding.members:
            binding.members.append(f"serviceAccount:{service_account_email}")
    else:
        policy.bindings.append({"role": "roles/artifactregistry.admin", "members": [f"serviceAccount:{service_account_email}"]})
    iam_client.set_iam_policy(resource=f"projects/{project_id}", policy=policy)
    print(f"Granted Artifact Registry Admin role to {service_account_email}")

def create_artifact_registry_repo(artifact_client, project_id, location, repository_id):
    """Create a new Artifact Registry repository."""
    parent = f"projects/{project_id}/locations/{location}"
    repository = Repository(
        name=f"{parent}/repositories/{repository_id}",
        format_=Repository.Format.DOCKER,
        description="GitHub Actions Docker Repository"
    )
    response = artifact_client.create_repository(parent=parent, repository_id=repository_id, repository=repository)
    print(f"Created Artifact Registry repository: {response.name}")

def main(github_username):
    project_id = "your-project-id"
    location = "us-east4"  # e.g., "us-central1"
    repository_id = "your-repo-id"

    # Initialize clients
    iam_client = IAMClient()
    artifact_client = ArtifactRegistryClient()

    # Step 1: Create a service account
    service_account_email = create_service_account(iam_client, project_id, github_username)

    # Step 2: Grant Artifact Registry Admin role to the service account
    grant_artifact_registry_admin_role(iam_client, project_id, service_account_email)

    # Step 3: Create an Artifact Registry repository
    create_artifact_registry_repo(artifact_client, project_id, location, repository_id)

    # Steps related to Workload Identity Federation and connecting to GitHub are not
    # directly executable in this script and would involve manual steps or using gcloud commands.
    # This would include creating a workload identity pool, a provider, and binding the GitHub repository
    # to the service account with specific roles.

if __name__ == "__main__":
    github_username = "bobofishbo"  # Replace with your GitHub username
    main(github_username)
