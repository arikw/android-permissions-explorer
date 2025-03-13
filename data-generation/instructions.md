## Instructions to Generate Permission Data

You can generate the permission data in two ways:

1. With Docker:
  Run the following command:
  ```
  docker run -v "$(pwd)":'/app' --workdir '/app/data-generation' node:18-alpine3.21 sh -c 'node ./gather-data.js > ../permissions.json'
  ```

2. Without Docker:
  Run the following command:
  ```
  node ./gather-data.js > ../permissions.json
  ```

These commands will generate the permission data and save it to the `permissions.json` file located one level up from the `data-generation` directory.
