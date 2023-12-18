export function send_log(data: any) {
    fetch("/api/log", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
}