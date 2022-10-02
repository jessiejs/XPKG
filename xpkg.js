var xpkg = {
    packages:{},
    repositories:[],
    async installRepository(repo) {
        if (!this.repositories.includes(repo)) {
            this.repositories.push(repo);
        } else {
            return;
        }
        var repoContents = await (await fetch(repo)).json();
        for (var i in repoContents.packages) {
            this.packages[repoContents.name+"@"+i] = repoContents.packages[i];
        }
    },
    async installPackage(name) {
        if (packages[name].dependencies) {
            for (var i in packages[name].dependencies) {
                await this.installRepository(packages[name].dependencies[i].repository);
                await this.installPackage(packages[name].dependencies[i].packageName);
            }
        }
        var src = await (await fetch(packages[name].src)).text();
        eval(src);
    },
    async main() {
        var data = {
            repositories:["https://codelikecraze.github.io/XPKG/testingRepositories/xpkg.json"],
            packages:["xkpg@test"]
        } || USERFILES.xpkg;
        for (var i in data.repositories) {
            await this.installRepository(data.repositories[i]);
        }
        for (var i in data.packages) {
            await this.installPackage(data.packages[i]);
        }
    }
};