const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8002;

// Your GitHub webhook secret
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

console.log(WEBHOOK_SECRET);

app.use(bodyParser.json());

function verifySignature(req, res, buf, encoding) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) {
    return res.status(403).send('No signature');
  }

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(buf, encoding);
  const digest = 'sha256=' + hmac.digest('hex');

  if (signature !== digest) {
    return res.status(403).send('Invalid signature');
  }
}

app.post('/checkmark', bodyParser.json({ verify: verifySignature }), (req, res) => {
  const event = req.headers['x-github-event'];
  const payload = req.body;

  

  if (event === 'issues') {
    const action = payload.action;
    const issue = payload.issue;
    if (action === 'edited') {
      const changes = payload.changes;
      if (changes && changes.body) {
        const oldBody = changes.body.from;
        const newBody = issue.body;

        if (/\[ \]/.test(oldBody) && /\[x\]/.test(newBody)) {
          console.log(`Checkbox checked in issue #${issue.number}`);
          // Perform your action here, e.g., posting a comment
        }
      }
    }
  }

  res.status(200).send('Event received');
});

app.get('/', (req,res)=> {
	res.send('Hello World');
});

function postComment(issueNumber, comment) {
  const url = `https://api.github.com/repos/your-username/your-repo/issues/${issueNumber}/comments`;
  const token = 'YOUR_GITHUB_TOKEN';
  
  axios.post(url, { body: comment }, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  })
  .then(response => {
    console.log('Comment posted successfully.');
  })
  .catch(error => {
    console.error('Failed to post comment:', error);
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
