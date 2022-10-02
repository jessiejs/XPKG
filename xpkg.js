var xpkg = {
    packages:{},
    repositories:[],
    installedPackages:[],
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
        if (!this.installedPackages.includes(name)) {
            this.installedPackages.push(name);
        } else {
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
    async init() {
        this.data = JSON.parse(USERFILES.xpkg || JSON.stringify({
            repositories:["https://codelikecraze.github.io/XPKG/testingRepositories/xpkg.json"],
            packages:["xpkg@test"]
        }));
    },
    async save() {
        ufsave("xpkg",JSON.stringify(this.data));
    },
    async main() {
        for (var i in this.data.repositories) {
            await this.installRepository(this.data.repositories[i]);
        }
        for (var i in this.data.packages) {
            await this.installPackage(this.data.packages[i]);
        }
    }
};
xpkg.init();
xpkg.main();
xpkg.save();