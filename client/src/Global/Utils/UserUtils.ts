export const getPatreonUrl = (currentPath: string) =>
{
	const clientId = "l88h6n_5TMTFWOec_nCWwJl9yWYQ46w60aGpr4BTxVNPw2v8sS-vj9xkt0SLTQnc";
	const host = window.location.host.replace("3000", "5000");
	const redirectUri = `${window.location.protocol}//${host}/auth/redirect`;
	const scopes = ["users", "pledges-to-me", "my-campaign"];
	const state = encodeURIComponent(currentPath);
	return `https://www.patreon.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes.join(" ")}&state=${state}`;
}