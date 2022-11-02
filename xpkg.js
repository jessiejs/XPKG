window.xpkg = {
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
    },
    async createCli() {
        apps.bash.vars.commands.push({
            name:'x',
            desc:'x [repository name to remove | package name to remove | repository name to add | package name to add] -repo -app -add -remove',
            usage:'x [repository name to remove | package name to remove | repository name to add | package name to add] -repo -app -add -remove',
            vars:{},
            action(args) {
                var primaryArg = null;
                for (var i in args) {
                    if (!args[i].startsWith("-")) {
                        primaryArg = args[i];
                    }
                }
                if (!args[i]) {
                    throw "XPKGError: Primary argument not found"
                }
                var type = "package";
                if (primaryArg.startsWith("http")) {
                    type = "repository";
                }
                if (args.includes("-repo")) {
                    type = "repository";
                }
                if (args.includes("-app")) {
                    type = "app";
                }
                var install = true;
                if (type == "package") {
                    if (this.data.packages.includes(primaryArg)) {
                        install = false;
                    }
                } else {
                    if (this.data.repositories.includes(primaryArg)) {
                        install = false;
                    }
                }
                if (args.includes("-add")) {
                    install = true;
                }
                if (args.includes("-remove")) {
                    install = false;
                }
                //now after all those checks, we can finally do the meat and potatoes
                if (type == "package") {
                    if (install) {
                        if (!this.packages[primaryArg]) { 
                            throw "XPKGError: Package '" + primaryArg + "' does not exist";
                        }
                        if (this.data.packages.includes(primaryArg)) {
                            throw "XPKGError: " + primaryArg + " is already installed";
                        }
                        this.data.packages.push(primaryArg);
                    } else {
                        if (!this.packages[primaryArg]) { 
                            throw "XPKGError: Package '" + primaryArg + "' does not exist";
                        }
                        if (!this.data.packages.includes(primaryArg)) {
                            throw "XPKGError: " + primaryArg + " is not installed";
                        }
                        this.data.packages.splice(this.data.packages.indexOf(primaryArg),-1);
                    }
                } else {
                    if (install) {
                        if (this.data.repositories.includes(primaryArg)) {
                            throw "XPKGError: " + primaryArg + " is already added";
                        }
                        this.data.packages.push(primaryArg);
                    } else {
                        if (!this.data.repositories.includes(primaryArg)) {
                            throw "XPKGError: " + primaryArg + " is not added";
                        }
                        this.data.repositories.splice(this.data.repositories.indexOf(primaryArg),-1);
                    }
                }
                xpkg.main()
            }
        });
    }
};
(async () => {
    await xpkg.init();
    await xpkg.main();
    await xpkg.save();
    await xpkg.createCli();
});