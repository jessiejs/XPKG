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
        if (!this.packages[name]) {
            console.error("Package " + name + " not found.");
            return;
        }
        if (this.packages[name].dependencies) {
            for (var i in this.packages[name].dependencies) {
                await this.installRepository(this.packages[name].dependencies[i].repository);
                await this.installPackage(this.packages[name].dependencies[i].packageName);
            }
        }
        var src = await (await fetch(this.packages[name].src)).text();
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
xpkg.main();