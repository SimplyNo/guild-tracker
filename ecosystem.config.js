module.exports = {
    apps: [
        {
            name: "guild-tracker",
            script: "yarn",
            args: "ts-node src/index.ts --swc --transpileOnly --files --color",
            args_: "run start:dev",
            log_date_format: "YYYY-MM-DD HH:mm Z"
        }]
}
