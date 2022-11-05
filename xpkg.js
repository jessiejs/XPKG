window.xpkg = {
    packages:{},
    repositories:[],
    installedPackages:[],
    async installRepository(repo) {
        if (!xpkg.repositories.includes(repo)) {
            xpkg.repositories.push(repo);
        } else {
            return;
        }
        var repoContents = await (await fetch(repo)).json();
        for (var i in repoContents.packages) {
            xpkg.packages[repoContents.name+"@"+i] = repoContents.packages[i];
        }
    },
    async installPackage(name) {
        if (!xpkg.packages[name]) {
            throw "Package " + name + " not found.";
            return;
        }
        if (!xpkg.installedPackages.includes(name)) {
            xpkg.installedPackages.push(name);
        } else {
            return;
        }
        if (xpkg.packages[name].dependencies) {
            for (var i in xpkg.packages[name].dependencies) {
                await xpkg.installRepository(xpkg.packages[name].dependencies[i].repository);
                await xpkg.installPackage(xpkg.packages[name].dependencies[i].packageName);
            }
        }
        var src = await (await fetch(xpkg.packages[name].src)).text();
        eval(src);
    },
    async init() {
        xpkg.data = JSON.parse(USERFILES.xpkg || JSON.stringify({
            repositories:["https://codelikecraze.github.io/XPKG/testingRepositories/xpkg.json"],
            packages:["xpkg@test"]
        }));
        xpkg.data = JSON.parse(USERFILES.xpkg);
    },
    async save() {
        ufsave("xpkg",JSON.stringify(xpkg.data));
    },
    async main() {
        for (var i in xpkg.data.repositories) {
            await xpkg.installRepository(xpkg.data.repositories[i]);
        }
        for (var i in xpkg.data.packages) {
            await xpkg.installPackage(xpkg.data.packages[i]);
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
                doLog("We are an app");
                if (primaryArg.startsWith("http")) {
                    type = "repository";
                    doLog("We are a repository");
                }
                if (args.includes("-repo")) {
                    type = "repository";
                    doLog("We are a repository");
                }
                if (args.includes("-app")) {
                    type = "app";
                    doLog("We are an app");
                }
                var install = true;
                if (type == "package") {
                    if (xpkg.data.packages.includes(primaryArg)) {
                        doLog("We are uninstalling a package");
                        install = false;
                    }
                } else {
                    if (xpkg.data.repositories.includes(primaryArg)) {
                        doLog("We are uninstalling a repository");
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
                        if (!xpkg.packages[primaryArg]) { 
                            throw "XPKGError: Package '" + primaryArg + "' does not exist";
                        }
                        if (xpkg.data.packages.includes(primaryArg)) {
                            throw "XPKGError: " + primaryArg + " is already installed";
                        }
                        xpkg.data.packages.push(primaryArg);
                    } else {
                        if (!xpkg.packages[primaryArg]) { 
                            throw "XPKGError: Package '" + primaryArg + "' does not exist";
                        }
                        if (!xpkg.data.packages.includes(primaryArg)) {
                            throw "XPKGError: " + primaryArg + " is not installed";
                        }
                        xpkg.data.packages.splice(xpkg.data.packages.indexOf(primaryArg),1);
                    }
                } else {
                    if (install) {
                        if (xpkg.data.repositories.includes(primaryArg)) {
                            throw "XPKGError: " + primaryArg + " is already added";
                        }
                        xpkg.data.repositories.push(primaryArg);
                    } else {
                        if (!xpkg.data.repositories.includes(primaryArg)) {
                            throw "XPKGError: " + primaryArg + " is not added";
                        }
                        doLog(xpkg.data.repositories.indexOf(primaryArg));
                        xpkg.data.repositories.splice(xpkg.data.repositories.indexOf(primaryArg),1);
                    }
                }
                xpkg.main();
                xpkg.save();
            }
        });
    }
};
(async () => {
    await xpkg.init();
    await xpkg.main();
    await xpkg.save();
    await xpkg.createCli();
})();