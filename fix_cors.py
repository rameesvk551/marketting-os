import re
with open('/home/ec2-user/marketting-os/marketing-os-server/dist/app.js', 'r') as f:
    content = f.read()
old = re.search(r'app\.use\(cors\(\{[^}]+\}\)\);', content, re.DOTALL)
if old:
    content = content.replace(old.group(0), 'app.use(cors({ origin: true, credentials: true }));')
    with open('/home/ec2-user/marketting-os/marketing-os-server/dist/app.js', 'w') as f:
        f.write(content)
    print('REPLACED')
else:
    print('NOT FOUND')
