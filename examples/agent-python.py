# Plannt L402 Agent Example — Python

import requests

def pay_lightning_invoice(invoice: str) -> str:
    raise NotImplementedError("Implement with your Lightning wallet")

def call_plannt_api(endpoint: str, method: str = "GET", body: dict = None) -> dict:
    url = f"https://api.plannt.com{endpoint}"
    headers = {"Content-Type": "application/json"} if body else {}

    response = requests.request(method, url, headers=headers, json=body)
    if response.status_code != 402:
        return response.json()

    challenge = response.json()
    macaroon = challenge["authorization_format"].split(" ")[1].split(":")[0]
    preimage = pay_lightning_invoice(challenge["invoice"])

    return requests.request(method, url,
        headers={**headers, "Authorization": f"L402 {macaroon}:{preimage}"},
        json=body).json()

if __name__ == "__main__":
    print(call_plannt_api("/v1/data"))
