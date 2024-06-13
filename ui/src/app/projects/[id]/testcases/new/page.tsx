"use client";
import { Button, Input, Textarea } from '@chakra-ui/react';
import PocketBase from 'pocketbase';
import { useState } from 'react';


export default function NewTestCases() {
  const pb = new PocketBase('http://127.0.0.1:8090');
  const [description, setDescription] = useState('');

  function onSubmit() {
    const data = {
      "code": "TEST-CASE",
      "description": description,
      "is_archived": false,
      "usage_count": 0,
      "tags": JSON.stringify({ tags: ['test', 'created-in-code'] })
    };
    pb.collection('test_cases').create(data);
  }


  return (
    <div>
      <form onSubmit={onSubmit}>
        <h3>Create Test Cases</h3>
        <Input placeholder='Code' />
        <Textarea
          onChange={(evt) => setDescription(evt.target.value)}
          placeholder='Describe the tests here as a markdown list, each on its own line starting with -' />

        <Button type="submit">Create Test Case</Button>
      </form>
    </div>

  )
}