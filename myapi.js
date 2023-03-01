const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'todoList';

exports.handler = async (event, context) => {
  try {
    let method = event.httpMethod;
    let params = {};
    let data = {};
    if (event.body) {
      data = JSON.parse(event.body);
    }
    if (event.pathParameters) {
      params.id = event.pathParameters.id;
    }

    switch (method) {
      case 'GET':
        if (params.id) {
          const result = await getItem(params.id);
          return buildResponse(200, result);
        } else {
          const result = await scanItems();
          return buildResponse(200, result);
        }
      case 'POST':
        if (data) {
          const result = await createItem(data);
          return buildResponse(201, result);
        } else {
          return buildResponse(400, { message: 'Invalid Request' });
        }
      case 'PUT':
        if (params.id && data) {
          const result = await updateItem(params.id, data);
          return buildResponse(200, result);
        } else {
          return buildResponse(400, { message: 'Invalid Request' });
        }
      case 'DELETE':
        if (params.id) {
          const result = await deleteItem(params.id);
          return buildResponse(200, result);
        } else {
          return buildResponse(400, { message: 'Invalid Request' });
        }
      default:
        return buildResponse(400, { message: 'Invalid Request' });
    }
  } catch (err) {
    console.error(err);
    return buildResponse(500, { message: 'Server Error' });
  }
};

const getItem = async (id) => {
  const params = {
    TableName: TABLE_NAME,
    Key: { id },
  };
  const result = await dynamodb.get(params).promise();
  return result.Item;
};

const scanItems = async () => {
  const params = {
    TableName: TABLE_NAME,
  };
  const result = await dynamodb.scan(params).promise();
  return result.Items;
};

const createItem = async (data) => {
  const params = {
    TableName: TABLE_NAME,
    Item: { id: new Date().getTime().toString(), ...data },
  };
  await dynamodb.put(params).promise();
  return params.Item;
};

const updateItem = async (id, data) => {
  const params = {
    TableName: TABLE_NAME,
    Key: { id },
    UpdateExpression: 'set title = :title, description = :description',
    ExpressionAttributeValues: {
      ':title': data.title,
      ':description': data.description,
    },
    ReturnValues: 'UPDATED_NEW',
  };
  const result = await dynamodb.update(params).promise();
  return result.Attributes;
};

const deleteItem = async (id) => {
  const params = {
    TableName: TABLE_NAME,
    Key: { id },
  };
  await dynamodb.delete(params).promise();
  return { message: 'Item deleted successfully' };
};

const buildResponse = (statusCode, body) => {
  return {
    statusCode: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
};
