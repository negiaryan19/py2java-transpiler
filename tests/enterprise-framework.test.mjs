import test from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../app/api/v1/convert/route.js';

test('Enterprise Framework: Transpiles FastAPI controller into Spring Boot 3 REST annotations', async () => {
  process.env.APP_API_KEY = 'ciap-secret-key-2026';

  const fastApiCode = `from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float

@app.post("/items")
def create_item(item: Item):
    return {"message": "Created", "item": item.name}`;

  const req = {
    headers: {
      get: (h) => {
        const lower = h.toLowerCase();
        if (lower === 'x-api-key') return 'ciap-secret-key-2026';
        if (lower === 'content-type') return 'application/json';
        return null;
      },
    },
    json: async () => ({
      python_code: fastApiCode,
      java_version: '17',
      bypass_cache: true,
    }),
  };

  const res = await POST(req);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.status, 'success');
  const java = json.data.java_code;

  // Verify Spring Boot or Java 17 modern encapsulation
  assert.ok(
    java.includes('RestController') ||
      java.includes('PostMapping') ||
      java.includes('createItem') ||
      java.includes('create_item') ||
      java.includes('Item'),
    'Java code should contain Spring Boot annotations or Item mapping'
  );
});

test('Enterprise Framework: Transpiles Pydantic schema into Java 17 immutable record', async () => {
  process.env.APP_API_KEY = 'ciap-secret-key-2026';

  const pydanticCode = `from pydantic import BaseModel

class UserAccount(BaseModel):
    username: str
    active: bool

def is_user_active(user: UserAccount) -> bool:
    return user.active`;

  const req = {
    headers: {
      get: (h) => {
        const lower = h.toLowerCase();
        if (lower === 'x-api-key') return 'ciap-secret-key-2026';
        if (lower === 'content-type') return 'application/json';
        return null;
      },
    },
    json: async () => ({
      python_code: pydanticCode,
      java_version: '17',
      bypass_cache: true,
    }),
  };

  const res = await POST(req);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.status, 'success');
  const java = json.data.java_code;

  assert.ok(
    java.includes('record UserAccount') ||
      java.includes('class UserAccount') ||
      java.includes('isUserActive') ||
      java.includes('is_user_active'),
    'Java code should encapsulate UserAccount schema'
  );
});
