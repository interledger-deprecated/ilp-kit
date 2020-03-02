import { assert } from 'chai';
import fs from 'fs';
import { runSql, getObject } from '../src/db';
import { makeHandler } from '../src/app';

async function runSqlFile(filename) {
  const file = fs.readFileSync(filename).toString().split('\r\n');
  for (const line of file) { // eslint-disable-line no-restricted-syntax
    await runSql(line, {}); // eslint-disable-line no-await-in-loop
  }
}

describe('Contacts', function () {
  beforeAll(() => {
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://snap:snap@localhost/test';
  });

  beforeEach(async function () {
    await runSqlFile('./schema.sql');
    await runSqlFile('./fixture.sql');
    this.hubbieHandler = {};
    this.hubbie = {
      addClient: () => {
        return undefined;
      },
      send: (peerName, msg, userId) => {
        this.snapSent.push({ peerName, msg, userId });
      },
      on: (eventName, eventHandler) => {
        this.hubbieHandler[eventName] = eventHandler;
      },
    };
    this.snapSent = [];
    this.handler = makeHandler(this.hubbie);
  }); 

  describe('contact creation', function () {
    beforeEach(function () {
      return new Promise(resolve => this.handler({
        headers: {
          authorization: 'Basic bWljaGllbDpxd2Vy',
        },
        url: '/contacts/new',
        method: 'PUT',
        on: (eventName, eventHandler) => {
          if (eventName === 'data') {
            setTimeout(() => eventHandler(JSON.stringify({
              name: 'name',
              url: 'url',
              token: 'some_token',
              min: -5,
            })), 0);
          } else {
            setTimeout(() => eventHandler(), 0);
          }
        },
      }, {
        end: () => {
          resolve();
        },
      }));
    });

    it.skip('creates a contact', async function () {
      const contacts = await runSql('SELECT * FROM contacts');
      const newContact = contacts[contacts.length - 1];
      assert.deepEqual(newContact, {
        userId: 1,
        id: 8,
        landmark: newContact.landmark, // UUID
        max: 0,
        min: -5,
        name: 'name',
        token: newContact.token,
        url: newContact.url,
      });
    });

    it.skip('sends a friend request', async function () {
      const friendRequestSent = JSON.parse(this.snapSent[0].msg);
      const expectedFriendRequest = {
        peerName: 'name',
        msg: JSON.stringify({
          msgType: 'FRIEND-REQUEST',
          url: `undefined/michiel/${friendRequestSent.url.substring('undefined/michiel/'.length)}`,
          trust: 5,
          myName: 'michiel',
          token: friendRequestSent.token,
        }),
        userId: 'michiel',
      };
      assert.deepEqual(this.snapSent[0], expectedFriendRequest);
    });

    it.skip('announces the landmark', async function () {
      const expectedLandmarkAnnouncement = {
        peerName: 'name',
        msg: JSON.stringify({
          msgType: 'ROUTING',
          canRoute: {
            landmark: {
              maxTo: 8,
              maxFrom: 51,
            },
            'landmark:qwer': {
              maxTo: 8,
              maxFrom: 51,
            },
          },
        }),
        userId: 'michiel',
      };
      assert.deepEqual(this.snapSent[1], expectedLandmarkAnnouncement);
    });
  });

  describe('incoming friend request', function () {
    beforeEach(async function () {
      await this.hubbieHandler.peer({
        peerName: 'name',
        peerSecret: 'incoming_token',
        userName: 'michiel',
      });

      return this.hubbieHandler.message('name', JSON.stringify({
        msgType: 'FRIEND-REQUEST',
        url: 'incoming_url',
        trust: 1234,
        myName: 'fred',
        token: 'incoming_token',
      }), 'michiel');
    });

    it.skip('creates a contact', async function () {
      const contacts = await runSql('SELECT * FROM contacts');
      const newContact = contacts[contacts.length - 1];
      assert.deepEqual(newContact, {
        userId: 1,
        id: 8,
        landmark: 'michiel:name',
        max: 1234,
        min: 0,
        name: 'fred',
        token: 'incoming_token',
        url: newContact.url,
      });
    });

    it.skip('deals with contact name clashes', async function () {
      await this.hubbieHandler.peer({
        peerName: 'name2',
        peerSecret: 'incoming_token2',
        userName: 'michiel',
      });
      await this.hubbieHandler.message('name2', JSON.stringify({
        msgType: 'FRIEND-REQUEST',
        url: 'incoming_url2',
        trust: 1234,
        myName: 'fred',
        token: 'incoming_token2',
      }), 'michiel');
      const contacts = await runSql('SELECT * FROM contacts');
      const newContact = contacts[contacts.length - 1];
      assert.deepEqual(newContact, {
        userId: 1,
        id: 9,
        landmark: 'michiel:name2',
        max: 1234,
        min: 0,
        name: 'fred 2',
        token: 'incoming_token2',
        url: newContact.url,
      });
    });

    it.skip('announces the landmark', async function () {
      const expectedLandmarkAnnouncement = {
        peerName: 'name',
        msg: JSON.stringify({
          msgType: 'ROUTING',
          canRoute: {
            landmark: {
              maxTo: 8,
              maxFrom: 51,
            },
            'landmark:qwer': {
              maxTo: 8,
              maxFrom: 51,
            },
          },
        }),
        userId: 'michiel',
      };
      assert.deepEqual(this.snapSent[0], expectedLandmarkAnnouncement);
    });
  });

  describe('contact update', function () {
    beforeEach(function () {
      return new Promise(resolve => this.handler({
        headers: {
          authorization: 'Basic bWljaGllbDpxd2Vy',
        },
        url: '/contacts/2',
        method: 'PUT',
        on: (eventName, eventHandler) => {
          if (eventName === 'data') {
            setTimeout(() => eventHandler(JSON.stringify({
              name: 'name',
              url: 'url',
              token: 'some_token',
              min: -5,
            })), 0);
          } else {
            setTimeout(() => eventHandler(), 0);
          }
        },
      }, {
        end: () => {
          resolve();
        },
      }));
    });

    it.skip('updates a contact', async function () {
      const contact = await getObject('SELECT * FROM contacts WHERE user_id = $1 AND id = $2', [1, 2]);
      assert.deepEqual(contact, {
        userId: 1,
        id: 2,
        landmark: contact.landmark,
        max: 0,
        min: -5,
        name: 'name',
        token: contact.token,
        url: contact.url,
      });
    });

    it.skip('sends an updated friend request', async function () {
      const friendRequestSent = JSON.parse(this.snapSent[0].msg);
      const expectedFriendRequest = {
        peerName: 'name',
        msg: JSON.stringify({
          msgType: 'FRIEND-REQUEST',
          url: `undefined/michiel/${friendRequestSent.url.substring('undefined/michiel/'.length)}`,
          trust: 5,
          myName: 'michiel', // when updating a contact, user will send their own username
          token: friendRequestSent.token,
        }),
        userId: 'michiel',
      };
      assert.deepEqual(this.snapSent[0], expectedFriendRequest);
    });

    it.skip('announces the updated landmark', async function () {
      const expectedLandmarkAnnouncement = {
        peerName: 'name',
        msg: JSON.stringify({
          msgType: 'ROUTING',
          canRoute: {
            landmark: {
              maxTo: 8,
              maxFrom: 51,
            },
            'landmark:qwer': {
              maxTo: 8,
              maxFrom: 51,
            },
          },
        }),
        userId: 'michiel',
      };
      assert.deepEqual(this.snapSent[1], expectedLandmarkAnnouncement);
    });
  });

  describe('contact delete', function () {
    beforeEach(function () {
      return new Promise(resolve => this.handler({
        headers: {
          authorization: 'Basic bWljaGllbDpxd2Vy',
        },
        url: '/contacts/2',
        method: 'DELETE',
        on: (eventName, eventHandler) => {
          if (eventName === 'end') {
            setTimeout(() => eventHandler(), 0);
          }
        },
      }, {
        end: () => {
          resolve();
        },
      }));
    });

    it.skip('deletes a contact', async function () {
      const matchingContacts = await runSql('SELECT * FROM contacts WHERE user_id = $1 AND id = $2', [1, 2]);
      assert.equal(matchingContacts, null);
    });
  });

  afterEach(async function () {
    await runSqlFile('./drop.sql');
  });

  afterAll(async function () {
    await close();
  });
});
