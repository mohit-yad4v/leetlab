import { db } from "../libs/db.js";
import { getJudge0LanguageId, pollBatchResults, submitBatch } from "../libs/judge0.lib.js";

export const createProblem = async (req, res) => {
    const { title, description, difficulty, tags, examples, constraints, testcases, codeSnippets, referenceSolutions } = req.body;

    if (req.user.role !== "ADMIN") {
        return res.status(403).json({
            error: "You are not allowed to create a problem"
        });
    }

    try {
        for (const [language, solutionCode] of Object.entries(referenceSolutions)) {

            const languageId = getJudge0LanguageId(language);

            if (!language) {
                return res.status(400).json({
                    error: `Language $(language) is not supported`
                });
            }

            const submissions = testcases.map(({ input, output }) => ({
                source_code: solutionCode,
                language_id: languageId,
                stdin: input,
                expected_output: output
            }));

            const submissionResults = await submitBatch(submissions);

            const tokens = submissionResults.map((res) => res.token);

            const results = await pollBatchResults(tokens);

            for (let i = 0; i < results.length; i++) {
                const result = results[i];

                console.log("Result......", result);


                if (result.status.id !== 3) {
                    return res.status(400).json({
                        error: `Testcase ${i + 1} failed for language ${language}`
                    });
                }
            }

        }
        const newProblem = await db.problem.create({
            data: {
                title,
                description,
                difficulty,
                tags,
                examples,
                constraints,
                testcases,
                codeSnippets,
                referenceSolutions,
                userId: req.user.id,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Message Created Successfully",
            problem: newProblem,
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: "Error While Creating Problem",
        });

    }
};

export const getAllproblems = async (req, res) => {
    try {
        const problems = await db.problem.findMany();

        if (!problems) {
            return res.status(404).json({
                error: "No problems found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Message fetched Successfully",
            problems
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: "Error while fetching problems"
        });
    }
};

export const getProblemById = async (req, res) => {
    const { id } = req.params;

    try {
        const problem = await db.problem.findUnique({
            where: {
                id
            }
        });

        if (!problem) {
            return res.status(404).json({ error: "Problem not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Message created successfully",
            problem
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: "Error while fetching problems b id"
        });

    }
};

export const updateProblem = async (req, res) => {
    const { title, description, difficulty, tags, examples, constraints, testcases, codeSnippets, referenceSolutions } = req.body;

    const { id: problemId } = req.params;
    console.log("problem id --------", req);



    if (req.user.role !== "ADMIN") {
        return res.status(403).json({
            error: "You are not allowed to create a problem"
        });
    }

    const existingProblem = await db.problem.findFirst({
        where: {
            id: problemId,
            userId: req.user.id
        }
    });

    if (!existingProblem) {
        return res.status(400).json({ error: "Problem not found" });
    }

    try {
        for (const [language, solutionCode] of Object.entries(referenceSolutions)) {

            const languageId = getJudge0LanguageId(language);

            if (!languageId) {
                return res.status(400).json({
                    error: `Language $(langauge) is not supported`
                });
            }

            const submissions = testcases.map(({ input, output }) => ({
                source_code: solutionCode,
                language_id: languageId,
                stdin: input,
                expected_output: output
            }));

            const submissionResults = await submitBatch(submissions);

            const tokens = submissionResults.map((res) => res.token);

            const results = await pollBatchResults(tokens);

            for (let i = 0; i < results.length; i++) {
                const result = results[i];

                console.log("Result.....", result);

                if (result.status.id !== 3) {
                    return res.status(400).json({
                        error: `Testcase ${i + 1} failed for language ${language}`
                    });
                }

            }

        }
        const problemUpdate = await db.problem.update({
            where: {
                id: problemId
            },
            data: {
                title,
                description,
                difficulty,
                tags,
                examples,
                constraints,
                testcases,
                codeSnippets,
                referenceSolutions,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Message updated successfully",
            problem: problemUpdate,
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: "Error while updating problem",
        });
    }
};

export const deleteProblem = async (req, res) => {
    const { id } = req.params;

    try {
        const problem = await db.problem.findUnique({ where: { id } });

        if (!problem) {
            return res.status(404).json({ error: "Problem not found" });
        }

        await db.problem.delete({ where: { id } });

        res.status(200).json({
            success: true,
            message: "Problem deleted successfully"
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: "Error while deleting the problem"
        });
    }
};

export const getAllProblemSolvedByUser = async (req, res) => {
    try {
        const problems = await db.problem.findMany({
            where: {
                solvedBy: {
                    some: {
                        userId: req.user.id
                    }
                }
            },
            include: {
                solvedBy: {
                    where: {
                        userId: req.user.id
                    }
                }
            }
        });

        res.status(200).json({
            success: true,
            message: "Problems fetched successfully",
            problems
        });
    } catch (error) {
        console.error("Error fetching problems:", error);
        res.status(500).json({ error: "Failed to fetch problems" });
    }
};