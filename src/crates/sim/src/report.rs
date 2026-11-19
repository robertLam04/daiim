use crate::metrics::{RequestResult, RunMetrics};
use plotters::prelude::*;
use std::collections::BTreeSet;
use std::error::Error;
use std::path::{Path, PathBuf};

pub fn write(root: &Path, name: &str, metrics: &RunMetrics) -> Result<PathBuf, Box<dyn Error>> {
    let directory = root.join(name);
    std::fs::create_dir_all(&directory)?;
    write_summary(&directory.join("summary.csv"), metrics)?;
    write_rounds(&directory.join("rounds.csv"), metrics)?;
    write_providers(&directory.join("providers.csv"), metrics)?;
    draw_median_errors(
        &directory.join("errors.svg"),
        metrics,
        "Weighted and unweighted median error",
        "Absolute error",
        RequestResult::absolute_error,
        RequestResult::unweighted_absolute_error,
    )?;
    draw_median_errors(
        &directory.join("relative_errors.svg"),
        metrics,
        "Weighted and unweighted median relative error",
        "Relative error (%)",
        RequestResult::relative_error_percent,
        RequestResult::unweighted_relative_error_percent,
    )?;
    draw_reputations(&directory.join("reputations.svg"), metrics)?;
    draw_provider_error_vs_reputation(
        &directory.join("provider_error_vs_reputation.svg"),
        metrics,
    )?;
    Ok(directory)
}

fn write_summary(path: &Path, metrics: &RunMetrics) -> Result<(), Box<dyn Error>> {
    let mut writer = csv::Writer::from_path(path)?;
    writer.write_record([
        "settled",
        "cancelled",
        "mean_absolute_error",
        "mean_unweighted_absolute_error",
        "mean_relative_error_percent",
        "mean_unweighted_relative_error_percent",
    ])?;
    writer.write_record([
        metrics.settled_count().to_string(),
        metrics.cancelled_count().to_string(),
        metrics
            .mean_absolute_error()
            .map_or(String::new(), |value| value.to_string()),
        metrics
            .mean_unweighted_absolute_error()
            .map_or(String::new(), |value| value.to_string()),
        metrics
            .mean_relative_error_percent()
            .map_or(String::new(), |value| value.to_string()),
        metrics
            .mean_unweighted_relative_error_percent()
            .map_or(String::new(), |value| value.to_string()),
    ])?;
    writer.flush()?;
    Ok(())
}

fn write_rounds(path: &Path, metrics: &RunMetrics) -> Result<(), Box<dyn Error>> {
    let mut writer = csv::Writer::from_path(path)?;
    writer.write_record([
        "round",
        "input",
        "truth",
        "aggregate",
        "unweighted_median",
        "absolute_error",
        "unweighted_absolute_error",
        "relative_error_percent",
        "unweighted_relative_error_percent",
        "status",
    ])?;
    for round in &metrics.rounds {
        writer.write_record([
            round.round.to_string(),
            round.input.to_string(),
            round.truth.to_string(),
            round
                .aggregate
                .map_or(String::new(), |value| value.to_string()),
            round
                .unweighted_median
                .map_or(String::new(), |value| value.to_string()),
            round
                .absolute_error()
                .map_or(String::new(), |value| value.to_string()),
            round
                .unweighted_absolute_error()
                .map_or(String::new(), |value| value.to_string()),
            round
                .relative_error_percent()
                .map_or(String::new(), |value| value.to_string()),
            round
                .unweighted_relative_error_percent()
                .map_or(String::new(), |value| value.to_string()),
            format!("{:?}", round.status),
        ])?;
    }
    writer.flush()?;
    Ok(())
}

fn write_providers(path: &Path, metrics: &RunMetrics) -> Result<(), Box<dyn Error>> {
    let mut writer = csv::Writer::from_path(path)?;
    writer.write_record([
        "round",
        "provider_id",
        "prediction",
        "truth",
        "absolute_error",
        "included",
        "weight",
        "reputation_before",
        "reputation_after",
        "reputation_change",
    ])?;
    for provider in &metrics.providers {
        writer.write_record([
            provider.round.to_string(),
            provider.provider_id.to_string(),
            provider
                .prediction
                .map_or(String::new(), |value| value.to_string()),
            provider.truth.to_string(),
            provider
                .absolute_error()
                .map_or(String::new(), |value| value.to_string()),
            provider.included.to_string(),
            provider
                .weight
                .map_or(String::new(), |value| value.to_string()),
            provider.reputation_before.to_string(),
            provider.reputation_after.to_string(),
            provider.reputation_change().to_string(),
        ])?;
    }
    writer.flush()?;
    Ok(())
}

fn draw_median_errors(
    path: &Path,
    metrics: &RunMetrics,
    title: &str,
    y_label: &str,
    weighted_error: fn(&RequestResult) -> Option<f64>,
    unweighted_error: fn(&RequestResult) -> Option<f64>,
) -> Result<(), Box<dyn Error>> {
    let max_error = metrics
        .rounds
        .iter()
        .flat_map(|round| {
            weighted_error(round)
                .into_iter()
                .chain(unweighted_error(round))
        })
        .fold(0.0_f64, f64::max)
        .max(1.0);
    let root = SVGBackend::new(path, (1000, 600)).into_drawing_area();
    root.fill(&WHITE)?;
    let mut chart = ChartBuilder::on(&root)
        .caption(title, ("sans-serif", 28))
        .margin(20)
        .x_label_area_size(40)
        .y_label_area_size(60)
        .build_cartesian_2d(
            1_u32..metrics.rounds.len() as u32 + 1,
            0.0_f64..max_error * 1.1,
        )?;
    chart
        .configure_mesh()
        .x_desc("Round")
        .y_desc(y_label)
        .draw()?;
    chart
        .draw_series(metrics.rounds.iter().filter_map(|round| {
            weighted_error(round).map(|error| Circle::new((round.round, error), 4, RED.filled()))
        }))?
        .label("Reputation weighted median")
        .legend(|(x, y)| Circle::new((x + 10, y), 4, RED.filled()));
    chart
        .draw_series(metrics.rounds.iter().filter_map(|round| {
            unweighted_error(round)
                .map(|error| TriangleMarker::new((round.round, error), 5, BLUE.filled()))
        }))?
        .label("Unweighted median (all reveals)")
        .legend(|(x, y)| TriangleMarker::new((x + 10, y), 5, BLUE.filled()));
    chart.configure_series_labels().border_style(BLACK).draw()?;
    root.present()?;
    Ok(())
}

fn draw_reputations(path: &Path, metrics: &RunMetrics) -> Result<(), Box<dyn Error>> {
    let provider_ids: BTreeSet<u8> = metrics
        .providers
        .iter()
        .map(|provider| provider.provider_id)
        .collect();
    let first_reputation = metrics.providers[0].reputation_after;
    let (min_reputation, max_reputation) = metrics.providers.iter().fold(
        (first_reputation, first_reputation),
        |(min, max), provider| {
            (
                min.min(provider.reputation_after),
                max.max(provider.reputation_after),
            )
        },
    );
    let padding = if min_reputation == max_reputation {
        1.0
    } else {
        (max_reputation - min_reputation) * 0.1
    };
    let root = SVGBackend::new(path, (1000, 600)).into_drawing_area();
    root.fill(&WHITE)?;
    let mut chart = ChartBuilder::on(&root)
        .caption("Provider reputation by round", ("sans-serif", 28))
        .margin(20)
        .x_label_area_size(40)
        .y_label_area_size(60)
        .build_cartesian_2d(
            1_u32..metrics.rounds.len() as u32 + 1,
            min_reputation - padding..max_reputation + padding,
        )?;
    chart
        .configure_mesh()
        .x_desc("Round")
        .y_desc("Reputation")
        .draw()?;
    for (index, provider_id) in provider_ids.into_iter().enumerate() {
        let color = Palette99::pick(index).mix(0.9);
        chart
            .draw_series(LineSeries::new(
                metrics
                    .providers
                    .iter()
                    .filter(|provider| provider.provider_id == provider_id)
                    .map(|provider| (provider.round, provider.reputation_after)),
                color.stroke_width(2),
            ))?
            .label(format!("Provider {provider_id}"))
            .legend(move |(x, y)| PathElement::new([(x, y), (x + 20, y)], color));
    }
    chart.configure_series_labels().border_style(BLACK).draw()?;
    root.present()?;
    Ok(())
}

fn draw_provider_error_vs_reputation(
    path: &Path,
    metrics: &RunMetrics,
) -> Result<(), Box<dyn Error>> {
    let included = metrics
        .providers
        .iter()
        .filter(|provider| provider.included);
    let max_error = included
        .clone()
        .filter_map(|provider| provider.absolute_error())
        .fold(0.0_f64, f64::max)
        .max(1.0);
    let (min_change, max_change) = included.fold((0.0_f64, 0.0_f64), |(min, max), provider| {
        let change = provider.reputation_change();
        (min.min(change), max.max(change))
    });
    let padding = ((max_change - min_change) * 0.1).max(0.1);
    let provider_ids: BTreeSet<u8> = metrics
        .providers
        .iter()
        .filter(|provider| provider.included)
        .map(|provider| provider.provider_id)
        .collect();
    let root = SVGBackend::new(path, (1000, 600)).into_drawing_area();
    root.fill(&WHITE)?;
    let mut chart = ChartBuilder::on(&root)
        .caption("Provider error vs reputation change", ("sans-serif", 28))
        .margin(20)
        .x_label_area_size(60)
        .y_label_area_size(70)
        .build_cartesian_2d(
            0.0_f64..max_error * 1.1,
            min_change - padding..max_change + padding,
        )?;
    chart
        .configure_mesh()
        .x_desc("Absolute error against truth")
        .y_desc("Reputation change")
        .draw()?;
    chart.draw_series(LineSeries::new(
        [(0.0, 0.0), (max_error * 1.1, 0.0)],
        BLACK.mix(0.4).stroke_width(1),
    ))?;
    for (index, provider_id) in provider_ids.into_iter().enumerate() {
        let color = Palette99::pick(index).mix(0.9);
        chart
            .draw_series(
                metrics
                    .providers
                    .iter()
                    .filter(|provider| provider.included && provider.provider_id == provider_id)
                    .filter_map(|provider| {
                        provider.absolute_error().map(|error| {
                            Circle::new((error, provider.reputation_change()), 4, color.filled())
                        })
                    }),
            )?
            .label(format!("Provider {provider_id}"))
            .legend(move |(x, y)| Circle::new((x + 10, y), 4, color.filled()));
    }
    chart.configure_series_labels().border_style(BLACK).draw()?;
    root.present()?;
    Ok(())
}
